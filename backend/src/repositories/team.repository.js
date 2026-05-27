const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const teamSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  owner: {
    select: { id: true, fullName: true, email: true },
  },
  _count: {
    select: { members: true, projects: true },
  },
};

async function createTeam({ name, description, ownerId }) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: { name, description, ownerId },
      select: teamSelect,
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: ownerId,
        role: 'owner',
      },
    });

    return team;
  });
}

async function findTeamsByUserId(userId) {
  return prisma.team.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    select: teamSelect,
    orderBy: { createdAt: 'desc' },
  });
}

async function findTeamById(teamId) {
  return prisma.team.findUnique({
    where: { id: teamId },
    select: teamSelect,
  });
}

async function findTeamMember(teamId, userId) {
  return prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
}

async function updateTeam(teamId, data) {
  return prisma.team.update({
    where: { id: teamId },
    data,
    select: teamSelect,
  });
}

async function deleteTeam(teamId) {
  return prisma.team.delete({
    where: { id: teamId },
  });
}

module.exports = {
  createTeam,
  findTeamsByUserId,
  findTeamById,
  findTeamMember,
  updateTeam,
  deleteTeam,
};