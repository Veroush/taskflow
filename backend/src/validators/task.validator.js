const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  sprintId: z.string().uuid('sprintId must be a valid UUID').optional(),
  assigneeId: z.string().uuid('assigneeId must be a valid UUID').optional(),
  parentTaskId: z.string().uuid('parentTaskId must be a valid UUID').optional(),
  storyPoints: z.number().int().min(0).optional(),
  dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO datetime' }).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

module.exports = { createTaskSchema, updateTaskSchema };