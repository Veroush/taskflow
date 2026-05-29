const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/config/prisma');

// ─── Test state ───────────────────────────────────────────────────────────────
let token;
let userId;
let teamId;
let projectId;
let taskId;
let memberToken;
let memberId;

// ─── Setup & Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  // 1. Clean up any leftovers from a previously failed run
  await prisma.user.deleteMany({ where: { email: 'tasks_test@test.com' } });
  await prisma.user.deleteMany({ where: { email: 'tasks_member@test.com' } });
  await prisma.team.deleteMany({ where: { name: 'Tasks Test Team' } });

  // 2. Register the primary test user (will be project admin)
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Tasks Tester',
      email: 'tasks_test@test.com',
      password: 'password123',
    });

  token = registerRes.body.data.token;
  userId = registerRes.body.data.user.id;

  // 3. Register a second user — will be added as a regular project member
  // We need this for the DELETE 403 test (member but not admin)
  const memberRes = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Tasks Member',
      email: 'tasks_member@test.com',
      password: 'password123',
    });

  memberToken = memberRes.body.data.token;
  memberId = memberRes.body.data.user.id;

  // 4. Create a test team
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Tasks Test Team' });

  teamId = teamRes.body.team.id;

  // 5. Create a test project
  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Tasks Test Project', teamId });

  projectId = projectRes.body.data.id;

  // 6. Add the second user as a regular member of the project directly via Prisma
  // The API only exposes admin-level project creation, so we seed this directly
  await prisma.projectMember.create({
    data: {
      projectId,
      userId: memberId,
      role: 'member',
    },
  });
});

afterAll(async () => {
  // Delete in order that respects foreign key constraints
  await prisma.task.deleteMany({ where: { projectId } });
  await prisma.projectMember.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.teamMember.deleteMany({ where: { teamId } });
  await prisma.team.deleteMany({ where: { id: teamId } });
  await prisma.user.deleteMany({ where: { email: 'tasks_test@test.com' } });
  await prisma.user.deleteMany({ where: { email: 'tasks_member@test.com' } });
  await prisma.$disconnect();
});

// ─── POST /api/projects/:projectId/tasks ──────────────────────────────────────
describe('POST /api/projects/:projectId/tasks', () => {
  it('should create a task and return 201', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.projectId).toBe(projectId);

    // Save for later tests
    taskId = res.body.data.id;
  });

  it('should allow a regular member (non-admin) to create a task', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Member Created Task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Member Created Task');
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Unauthorized Task' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project member', async () => {
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Outsider User',
        email: 'tasks_outsider@test.com',
        password: 'password123',
      });
    const outsiderToken = outsiderRes.body.data.token;

    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Sneaky Task' });

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'tasks_outsider@test.com' } });
  });
});

// ─── GET /api/projects/:projectId/tasks ───────────────────────────────────────
describe('GET /api/projects/:projectId/tasks', () => {
  it('should return all tasks for a project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
describe('GET /api/tasks/:id', () => {
  it('should return a single task by id', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', taskId);
    expect(res.body.data.title).toBe('Test Task');
  });

  it('should return 404 for a non-existent task id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`);

    expect(res.statusCode).toBe(401);
  });
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
describe('PATCH /api/tasks/:id', () => {
  it('should update a task when the user is a project member', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Task Title' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Task Title');
  });

  it('should allow a regular member (non-admin) to update a task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Member Updated Task' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Member Updated Task');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ title: 'Should Fail' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is not a project member', async () => {
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Outsider User',
        email: 'tasks_outsider2@test.com',
        password: 'password123',
      });
    const outsiderToken = outsiderRes.body.data.token;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Hacked Task' });

    expect(res.statusCode).toBe(403);

    await prisma.user.deleteMany({ where: { email: 'tasks_outsider2@test.com' } });
  });
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
describe('DELETE /api/tasks/:id', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`);

    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when user is a member but not an admin', async () => {
    // memberToken is a real project member with role: 'member' — not admin
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('should delete a task when the user is a project admin', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Task deleted successfully');
  });
});