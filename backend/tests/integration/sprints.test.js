const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/config/prisma');

// ─── Test state ───────────────────────────────────────────────────────────────
let token;
let userId;
let teamId;
let projectId;
let sprintId;

// ─── Setup & Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  // 1. Clean up any leftovers from a previously failed run
  await prisma.user.deleteMany({ where: { email: 'sprints_test@test.com' } });
  await prisma.team.deleteMany({ where: { name: 'Sprints Test Team' } });

  // 2. Register a fresh test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Sprints Tester',
      email: 'sprints_test@test.com',
      password: 'password123',
    });

  token = registerRes.body.data.token;
  userId = registerRes.body.data.user.id;

  // 3. Create a test team
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Sprints Test Team' });

  teamId = teamRes.body.team.id;

  // 4. Create a test project — sprints require a projectId
  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Sprints Test Project', teamId });

  projectId = projectRes.body.data.id;
});

afterAll(async () => {
  // Delete in order that respects foreign key constraints
  await prisma.sprint.deleteMany({ where: { projectId } });
  await prisma.projectMember.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.teamMember.deleteMany({ where: { teamId } });
  await prisma.team.deleteMany({ where: { id: teamId } });
  await prisma.user.deleteMany({ where: { email: 'sprints_test@test.com' } });
  await prisma.$disconnect();
});

// ─── POST /api/projects/:projectId/sprints ────────────────────────────────────
describe('POST /api/projects/:projectId/sprints', () => {
  it('should create a sprint and return 201', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sprint 1',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-14T00:00:00.000Z',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Sprint 1');
    expect(res.body.data.projectId).toBe(projectId);

    // Save for later tests
    sprintId = res.body.data.id;
  });

  it('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/sprints`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-14T00:00:00.000Z',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/sprints`)
      .send({
        name: 'Unauthorized Sprint',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-14T00:00:00.000Z',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project admin', async () => {
    // Register a second user who has no project membership
    const secondUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Non Admin Sprint User',
        email: 'non_admin_sprints@test.com',
        password: 'password123',
      });
    const secondToken = secondUserRes.body.data.token;

    const res = await request(app)
      .post(`/api/projects/${projectId}/sprints`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({
        name: 'Sneaky Sprint',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-14T00:00:00.000Z',
      });

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'non_admin_sprints@test.com' } });
  });
});

// ─── GET /api/projects/:projectId/sprints ─────────────────────────────────────
describe('GET /api/projects/:projectId/sprints', () => {
  it('should return all sprints for a project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/sprints`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/sprints`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/sprints/:id ─────────────────────────────────────────────────────
describe('GET /api/sprints/:id', () => {
  it('should return a single sprint by id', async () => {
    const res = await request(app)
      .get(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', sprintId);
    expect(res.body.data.name).toBe('Sprint 1');
  });

  it('should return 404 for a non-existent sprint id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/sprints/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/sprints/${sprintId}`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── PATCH /api/sprints/:id ───────────────────────────────────────────────────
describe('PATCH /api/sprints/:id', () => {
  it('should update a sprint when the user is a project admin', async () => {
    const res = await request(app)
      .patch(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1 Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Sprint 1 Updated');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .patch(`/api/sprints/${sprintId}`)
      .send({ name: 'Should Fail' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project admin', async () => {
    const secondUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Non Admin Sprint User',
        email: 'non_admin_sprints2@test.com',
        password: 'password123',
      });
    const secondToken = secondUserRes.body.data.token;

    const res = await request(app)
      .patch(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ name: 'Hacked Sprint' });

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'non_admin_sprints2@test.com' } });
  });
});

// ─── DELETE /api/sprints/:id ──────────────────────────────────────────────────
describe('DELETE /api/sprints/:id', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .delete(`/api/sprints/${sprintId}`);

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project admin', async () => {
    const secondUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Non Admin Sprint User',
        email: 'non_admin_sprints3@test.com',
        password: 'password123',
      });
    const secondToken = secondUserRes.body.data.token;

    const res = await request(app)
      .delete(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'non_admin_sprints3@test.com' } });
  });

  it('should delete a sprint when the user is a project admin', async () => {
    const res = await request(app)
      .delete(`/api/sprints/${sprintId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Sprint deleted successfully');
  });
});