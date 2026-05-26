const { z } = require('zod');

const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  status: z.enum(['planned', 'active', 'completed']).optional(),
  startDate: z.string().datetime({ message: 'startDate must be a valid ISO datetime' }).optional(),
  endDate: z.string().datetime({ message: 'endDate must be a valid ISO datetime' }).optional(),
});

const updateSprintSchema = createSprintSchema.partial();

module.exports = { createSprintSchema, updateSprintSchema };