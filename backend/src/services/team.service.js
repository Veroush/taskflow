const {
  createTeam,
  findTeamsByUserId,
  findTeamById,
  findTeamMember,
  updateTeam,
  deleteTeam,
} = require('../repositories/team.repository');

async function createTeamService({ name, description, ownerId }) {
  return createTeam({ name, description, ownerId });
}

async function getUserTeams(userId) {
  return findTeamsByUserId(userId);
}

async function getTeamById(teamId, userId) {
  const team = await findTeamById(teamId);

  if (!team) {
    const err = new Error('Team not found');
    err.statusCode = 404;
    throw err;
  }

  const membership = await findTeamMember(teamId, userId);
  if (!membership) {
    const err = new Error('You do not have access to this team');
    err.statusCode = 403;
    throw err;
  }

  return team;
}

async function updateTeamService(teamId, userId, data) {
  const team = await findTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found');
    err.statusCode = 404;
    throw err;
  }

  const membership = await findTeamMember(teamId, userId);
  if (!membership || membership.role !== 'owner') {
    const err = new Error('Only the team owner can update this team');
    err.statusCode = 403;
    throw err;
  }

  return updateTeam(teamId, data);
}

async function deleteTeamService(teamId, userId) {
  const team = await findTeamById(teamId);
  if (!team) {
    const err = new Error('Team not found');
    err.statusCode = 404;
    throw err;
  }

  const membership = await findTeamMember(teamId, userId);
  if (!membership || membership.role !== 'owner') {
    const err = new Error('Only the team owner can delete this team');
    err.statusCode = 403;
    throw err;
  }

  await deleteTeam(teamId);
  return { message: 'Team deleted successfully' };
}

module.exports = {
  createTeamService,
  getUserTeams,
  getTeamById,
  updateTeamService,
  deleteTeamService,
};