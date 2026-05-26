const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createProject = async (data) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        createdById: data.createdById,
        status: data.status || 'active',
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: data.createdById,
        role: 'admin',
      },
    });

    return project;
  });
};

const findProjectsByTeamId = async (teamId) => {
  return prisma.project.findMany({
    where: { teamId },
    include: {
      createdBy: {
        select: { id: true, fullName: true, email: true },
      },
      _count: {
        select: { members: true, tasks: true, sprints: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findProjectById = async (projectId) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: {
        select: { id: true, fullName: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
      _count: {
        select: { tasks: true, sprints: true },
      },
    },
  });
};

const findProjectMember = async (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
};

const updateProject = async (projectId, data) => {
  return prisma.project.update({
    where: { id: projectId },
    data,
  });
};

const deleteProject = async (projectId) => {
  return prisma.project.delete({
    where: { id: projectId },
  });
};

module.exports = {
  createProject,
  findProjectsByTeamId,
  findProjectById,
  findProjectMember,
  updateProject,
  deleteProject,
};