const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// The safe fields we always return for a project
// We never return internal fields like __v or raw join table data
const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  team: {
    select: { id: true, name: true },
  },
  createdBy: {
    select: { id: true, fullName: true, email: true },
  },
  // Count members instead of returning the whole array
  // This keeps responses lean
  _count: {
    select: { members: true, tasks: true, sprints: true },
  },
};

/**
 * Create a new project and automatically add the creator as an admin member.
 * We use a Prisma transaction so both operations succeed or both fail together.
 * This is called an "atomic operation" — the database is never left in a half-finished state.
 */
async function createProject({ name, description, teamId, createdById }) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        description,
        teamId,
        createdById,
      },
      select: projectSelect,
    });

    // Automatically enroll the creator as an admin of their own project
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: createdById,
        role: 'admin',
      },
    });

    return project;
  });
}

/**
 * Find all projects where this user is a member.
 * This is a JOIN through the project_members table.
 */
async function findProjectsByUserId(userId) {
  return prisma.project.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    select: projectSelect,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Find a single project by its ID.
 * Returns null if not found — the service layer decides what to do with null.
 */
async function findProjectById(projectId) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: projectSelect,
  });
}

/**
 * Check if a user is a member of a project and return their role.
 * Used by the service layer for authorization checks.
 */
async function findProjectMember(projectId, userId) {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
}

/**
 * Update project fields. Only pass the fields that changed.
 */
async function updateProject(projectId, data) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    select: projectSelect,
  });
}

/**
 * Delete a project. Prisma cascades to members, tasks, sprints automatically
 * because we set onDelete: Cascade in the schema.
 */
async function deleteProject(projectId) {
  return prisma.project.delete({
    where: { id: projectId },
  });
}

module.exports = {
  createProject,
  findProjectsByUserId,
  findProjectById,
  findProjectMember,
  updateProject,
  deleteProject,
};