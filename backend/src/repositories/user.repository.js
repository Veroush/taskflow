const { PrismaClient } = require('@prisma/client');

// WHY: One instance, reused across all requests.
// Creating a new PrismaClient per request = connection pool exhaustion.
const prisma = new PrismaClient();

/**
 * Find a user by email.
 * Used during login and to check for duplicate registrations.
 * Returns the FULL user object including passwordHash (needed for login comparison).
 */
const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Find a user by their UUID.
 * Used by the JWT middleware to load the current user on protected routes.
 * Returns safe fields only — never the password hash.
 */
const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    // WHY select: we never want the password hash going anywhere
    // except the login comparison. Selecting fields here means
    // we physically cannot accidentally leak it.
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });
};

/**
 * Create a new user.
 * IMPORTANT: passwordHash must already be hashed before calling this.
 * The repository never hashes — that is the service's job.
 */
const createUser = async ({ email, passwordHash, fullName }) => {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
    },
    // Return safe fields only — never the hash
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });
};

module.exports = { findUserByEmail, findUserById, createUser };