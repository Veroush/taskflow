const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createSprint = async (data) => {
  return prisma.sprint.create({ data });
};

const findSprintsByProjectId = async (projectId) => {
  return prisma.sprint.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
};

const findSprintById = async (id) => {
  return prisma.sprint.findUnique({
    where: { id },
    include: { tasks: true },
  });
};

const updateSprint = async (id, data) => {
  return prisma.sprint.update({ where: { id }, data });
};

const deleteSprint = async (id) => {
  return prisma.sprint.delete({ where: { id } });
};

module.exports = {
  createSprint,
  findSprintsByProjectId,
  findSprintById,
  updateSprint,
  deleteSprint,
};