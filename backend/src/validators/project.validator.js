const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
  teamId: z
    .string({ required_error: 'Team ID is required' })
    .uuid('Team ID must be a valid UUID'),
  status: z
    .enum(['active', 'archived', 'completed'], {
      errorMap: () => ({ message: 'Status must be active, archived, or completed' }),
    })
    .optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'archived', 'completed'], {
      errorMap: () => ({ message: 'Status must be active, archived, or completed' }),
    })
    .optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };