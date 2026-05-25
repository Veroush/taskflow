const { z } = require('zod');

// Used for POST /api/projects
const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),

  // The team this project belongs to
  teamId: z
    .string({ required_error: 'teamId is required' })
    .uuid('teamId must be a valid UUID'),
});

// Used for PATCH /api/projects/:id
// .partial() makes every field optional — perfect for updates
// where the client only sends what changed
const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),

  // Only these status values are valid — Zod enforces the enum
  status: z.enum(['active', 'archived']).optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };