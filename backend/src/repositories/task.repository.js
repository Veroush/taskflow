const prisma = require('../config/prisma');

const createTask = async (data) => {
  return prisma.task.create({ data });
};

const findTasksByProjectId = async (projectId) => {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    include: {
      assignee: { select: { id: true, fullName: true, email: true } },
      createdBy: { select: { id: true, fullName: true, email: true } },
    },
  });
};

const findTaskById = async (id) => {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, fullName: true, email: true } },
      createdBy: { select: { id: true, fullName: true, email: true } },
      subtasks: true,
      comments: true,
    },
  });
};

const updateTask = async (id, data) => {
  return prisma.task.update({ where: { id }, data });
};

const deleteTask = async (id) => {
  return prisma.task.delete({ where: { id } });
};

module.exports = {
  createTask,
  findTasksByProjectId,
  findTaskById,
  updateTask,
  deleteTask,
};