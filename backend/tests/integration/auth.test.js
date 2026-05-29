const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/config/prisma');

// We'll use a unique email so re-running tests doesn't fail on "email already exists"
const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'Test User';

// Clean up after all tests in this file finish
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: 'testuser_' } },
  });
  await prisma.$disconnect();
});

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, fullName: TEST_NAME });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    // Never expose passwordHash in the response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should return 400 if email is already taken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, fullName: TEST_NAME });

    expect(res.statusCode).toBe(409);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: TEST_PASSWORD, fullName: TEST_NAME });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'another@test.com', password: '123', fullName: TEST_NAME });

    expect(res.statusCode).toBe(400);
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('should login and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with email that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: TEST_PASSWORD });

    expect(res.statusCode).toBe(401);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: TEST_PASSWORD });

    expect(res.statusCode).toBe(400);
  });
});

// ─── GET ME ───────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  let token;

  // Log in once before these tests to get a real token
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    token = res.body.data.token;
  });

  it('should return the logged-in user', async () => {
   const res = await request(app)
     .get('/api/auth/me')
     .set('Authorization', `Bearer ${token}`);

   expect(res.statusCode).toBe(200);
   expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with a fake token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer faketoken123');
    expect(res.statusCode).toBe(401);
  });
});