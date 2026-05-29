const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/config/prisma');

let token;
let userId;
let teamId;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'teams_tester@test.com' } });

  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Teams Tester',        // ← was 'name'
    email: 'teams_tester@test.com',
    password: 'password123',
  });

  token = res.body.data.token;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  // Clean up: delete all teams owned by our test user, then delete the user
  await prisma.teamMember.deleteMany({ where: { userId } });
  await prisma.team.deleteMany({ where: { ownerId: userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

// ─── POST /api/teams ───────────────────────────────────────────────────────────

describe('POST /api/teams', () => {
  test('201 — creates a team and returns it', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Team', description: 'A team for testing' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('team');
    expect(res.body.team).toHaveProperty('id');
    expect(res.body.team.name).toBe('Test Team');

    // Save teamId for the rest of the tests
    teamId = res.body.team.id;
  });

  test('400 — rejects missing name', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No name provided' });

    expect(res.statusCode).toBe(400);
  });

  test('401 — rejects request with no token', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({ name: 'Ghost Team' });

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/teams ────────────────────────────────────────────────────────────

describe('GET /api/teams', () => {
  test('200 — returns array of teams for the user', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('teams');
    expect(Array.isArray(res.body.teams)).toBe(true);
  });

  test('401 — rejects request with no token', async () => {
    const res = await request(app).get('/api/teams');

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/teams/:id ────────────────────────────────────────────────────────

describe('GET /api/teams/:id', () => {
  test('200 — returns the team for a member', async () => {
    const res = await request(app)
      .get(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('team');
    expect(res.body.team.id).toBe(teamId);
  });

  test('401 — rejects request with no token', async () => {
    const res = await request(app).get(`/api/teams/${teamId}`);

    expect(res.statusCode).toBe(401);
  });

  test('404 — returns 404 for a non-existent team id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/teams/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// ─── PATCH /api/teams/:id ──────────────────────────────────────────────────────

describe('PATCH /api/teams/:id', () => {
  test('200 — owner can update the team', async () => {
    const res = await request(app)
      .patch(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Team Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('team');
    expect(res.body.team.name).toBe('Updated Team Name');
  });

  test('401 — rejects request with no token', async () => {
    const res = await request(app)
      .patch(`/api/teams/${teamId}`)
      .send({ name: 'Should Fail' });

    expect(res.statusCode).toBe(401);
  });

  test('403 — non-owner cannot update the team', async () => {
    // Register a second user who is NOT a member of this team
    const otherRes = await request(app).post('/api/auth/register').send({
      fullName: 'Other User',
      email: 'other_teams_tester@test.com',
      password: 'password123',
    });
    const otherToken = otherRes.body.data.token;
    const otherUserId = otherRes.body.data.user.id;

    const res = await request(app)
      .patch(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hijacked Name' });

    // Clean up the second user
    await prisma.user.delete({ where: { id: otherUserId } });

    expect(res.statusCode).toBe(403);
  });
});

// ─── DELETE /api/teams/:id ─────────────────────────────────────────────────────

describe('DELETE /api/teams/:id', () => {
  test('401 — rejects request with no token', async () => {
    const res = await request(app).delete(`/api/teams/${teamId}`);

    expect(res.statusCode).toBe(401);
  });

  test('403 — non-owner cannot delete the team', async () => {
    const otherRes = await request(app).post('/api/auth/register').send({
      fullName: 'Other User 2',
      email: 'other_teams_tester2@test.com',
      password: 'password123',
    });
    const otherToken = otherRes.body.data.token;
    const otherUserId = otherRes.body.data.user.id;

    const res = await request(app)
      .delete(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    // Clean up the second user
    await prisma.user.delete({ where: { id: otherUserId } });

    expect(res.statusCode).toBe(403);
  });

  test('200 — owner can delete the team', async () => {
    const res = await request(app)
      .delete(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Team deleted successfully');
  });
});