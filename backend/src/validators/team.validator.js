const { z } = require('zod');

const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});

module.exports = { createTeamSchema, updateTeamSchema };