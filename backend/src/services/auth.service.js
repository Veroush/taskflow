const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../repositories/user.repository');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// WHY 12: Salt rounds control how slow bcrypt is.
// 12 = ~250ms per hash on modern hardware. Slow enough to deter brute force,
// fast enough that real users don't notice.
const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * Flow: check duplicate → hash password → save → return JWT
 */
const registerUser = async ({ email, password, fullName }) => {
  // 1. Check for duplicate email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    // WHY attach statusCode to the error object:
    // Our global error handler reads err.statusCode to set the HTTP status.
    // This lets any layer throw an error and have it handled correctly.
    const error = new Error('Email already in use');
    error.statusCode = 409; // 409 Conflict — the resource already exists
    throw error;
  }

  // 2. Hash the password — NEVER store plain text
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Save to database via repository
  const newUser = await createUser({ email, passwordHash, fullName });

  // 4. Issue a JWT so user is logged in immediately after registering
  const token = generateToken(newUser.id);

  return { user: newUser, token };
};

/**
 * Log in an existing user.
 * Flow: find user → compare password → return JWT
 */
const loginUser = async ({ email, password }) => {
  // 1. Find user — we need the full record including passwordHash
  const user = await prisma.user.findUnique({ where: { email } });

  // 2. Same error whether email is wrong OR password is wrong
  // WHY: Prevents attackers from learning which emails are registered
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401; // 401 Unauthorized
    throw error;
  }

  // 3. Compare plain-text password against the stored hash
  // WHY bcrypt.compare and not just hashing again:
  // bcrypt embeds a random "salt" in each hash, so the same password
  // produces a different hash every time. compare() handles this correctly.
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 4. Build a safe user object — strip the password hash before returning
  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  };

  const token = generateToken(user.id);
  return { user: safeUser, token };
};

/**
 * Create a signed JWT containing the user's ID.
 * Private to this file — only the auth service should ever mint tokens.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },                        // payload — stored inside the token
    process.env.JWT_SECRET,            // secret — signs and verifies the token
    { expiresIn: process.env.JWT_EXPIRES_IN } // e.g. '7d'
  );
};

module.exports = { registerUser, loginUser };