const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/config/prisma');

// ─── Test state ───────────────────────────────────────────────────────────────
let token;
let userId;
let teamId;
let projectId;

// ─── Setup & Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  // 1. Clean up any leftover data from a previously failed run
  await prisma.project.deleteMany({ where: { name: 'Test Project' } });
  await prisma.project.deleteMany({ where: { name: 'Updated Project' } });
  await prisma.team.deleteMany({ where: { name: 'Projects Test Team' } });
  await prisma.user.deleteMany({ where: { email: 'projects_test@test.com' } });

  // 2. Register a fresh test user and capture the JWT
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Projects Tester',
      email: 'projects_test@test.com',
      password: 'password123',
    });

  token = registerRes.body.data.token;
  userId = registerRes.body.data.user.id;

  // 3. Create a test team — projects require a teamId
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Projects Test Team' });

  teamId = teamRes.body.team.id;
});

afterAll(async () => {
  // Delete in order that respects foreign key constraints:
  // tasks → sprints → project members → projects → team members → teams → user
  await prisma.task.deleteMany({ where: { project: { name: 'Test Project' } } });
  await prisma.task.deleteMany({ where: { project: { name: 'Updated Project' } } });
  await prisma.sprint.deleteMany({ where: { project: { teamId } } });
  await prisma.projectMember.deleteMany({ where: { project: { teamId } } });
  await prisma.project.deleteMany({ where: { teamId } });
  await prisma.teamMember.deleteMany({ where: { teamId } });
  await prisma.team.deleteMany({ where: { id: teamId } });
  await prisma.user.deleteMany({ where: { email: 'projects_test@test.com' } });
  await prisma.$disconnect();
});

// ─── POST /api/projects ───────────────────────────────────────────────────────
describe('POST /api/projects', () => {
  it('should create a project and return 201', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', teamId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Test Project');
    expect(res.body.data.teamId).toBe(teamId);

    // Save for later tests
    projectId = res.body.data.id;
  });

  it('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ teamId });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when teamId is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Team Project' });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Unauthorized Project', teamId });

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/projects?teamId= ────────────────────────────────────────────────
describe('GET /api/projects', () => {
  it('should return all projects for a team', async () => {
    const res = await request(app)
      .get(`/api/projects?teamId=${teamId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/projects?teamId=${teamId}`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
describe('GET /api/projects/:id', () => {
  it('should return a single project by id', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', projectId);
    expect(res.body.data).toHaveProperty('name', 'Test Project');
  });

  it('should return 404 for a non-existent project id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────
describe('PATCH /api/projects/:id', () => {
  it('should update a project when the user is a project admin', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Project');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .send({ name: 'Should Fail' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project admin', async () => {
    // Register a second user who is NOT a member of this project
    const secondUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Non Admin User',
        email: 'non_admin_projects@test.com',
        password: 'password123',
      });
    const secondToken = secondUserRes.body.data.token;

    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ name: 'Hacked Name' });

    expect(res.statusCode).toBe(403);

    // Clean up the second user immediately
    await prisma.user.deleteMany({ where: { email: 'non_admin_projects@test.com' } });
  });
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
describe('DELETE /api/projects/:id', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`);

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project admin', async () => {
    const secondUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Non Admin User',
        email: 'non_admin_projects2@test.com',
        password: 'password123',
      });
    const secondToken = secondUserRes.body.data.token;

    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'non_admin_projects2@test.com' } });
  });

  it('should delete a project when the user is a project admin', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});