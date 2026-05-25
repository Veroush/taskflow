const { z } = require('zod');

// WHY: We define the exact "shape" of valid registration data.
// Zod throws a structured error if anything doesn't match.
const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(), // normalize before saving — User@Gmail.com = user@gmail.com

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'), // bcrypt has a hard 72-byte limit

  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(), // remove accidental leading/trailing spaces
});

// WHY: Login only needs email + password.
// Less data = less surface area for bugs.
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'), // don't hint at length requirements at login
});

module.exports = { registerSchema, loginSchema };