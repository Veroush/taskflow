const {
  createProject,
  findProjectsByTeamId,
  findProjectById,
  findProjectMember,
  updateProject,
  deleteProject,
} = require('../repositories/project.repository');

const { findTeamMember } = require('../repositories/team.repository');

const createProjectService = async (data) => {
  const teamMember = await findTeamMember(data.teamId, data.createdById);
  if (!teamMember) {
    const error = new Error('You are not a member of this team');
    error.statusCode = 403;
    throw error;
  }
  return createProject(data);
};

const getProjectsByTeam = async (teamId, userId) => {
  const teamMember = await findTeamMember(teamId, userId);
  if (!teamMember) {
    const error = new Error('You are not a member of this team');
    error.statusCode = 403;
    throw error;
  }
  return findProjectsByTeamId(teamId);
};

const getProjectById = async (projectId, userId) => {
  const project = await findProjectById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  const projectMember = await findProjectMember(projectId, userId);
  if (!projectMember) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

const updateProjectService = async (projectId, userId, data) => {
  const project = await findProjectById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  const projectMember = await findProjectMember(projectId, userId);
  if (!projectMember || projectMember.role !== 'admin') {
    const error = new Error('Only project admins can update this project');
    error.statusCode = 403;
    throw error;
  }
  return updateProject(projectId, data);
};

const deleteProjectService = async (projectId, userId) => {
  const project = await findProjectById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  const projectMember = await findProjectMember(projectId, userId);
  if (!projectMember || projectMember.role !== 'admin') {
    const error = new Error('Only project admins can delete this project');
    error.statusCode = 403;
    throw error;
  }
  return deleteProject(projectId);
};

module.exports = {
  createProjectService,
  getProjectsByTeam,
  getProjectById,
  updateProjectService,
  deleteProjectService,
};