const {
  createSprint,
  findSprintsByProjectId,
  findSprintById,
  updateSprint,
  deleteSprint,
} = require('../repositories/sprint.repository');

const { findProjectMember } = require('../repositories/project.repository');

const createSprintService = async (projectId, userId, data) => {
  const membership = await findProjectMember(projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const error = new Error('Only project admins can create sprints');
    error.statusCode = 403;
    throw error;
  }

  return createSprint({ ...data, projectId });
};

const getSprintsByProject = async (projectId, userId) => {
  const membership = await findProjectMember(projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  return findSprintsByProjectId(projectId);
};

const getSprintById = async (id, userId) => {
  const sprint = await findSprintById(id);
  if (!sprint) {
    const error = new Error('Sprint not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(sprint.projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  return sprint;
};

const updateSprintService = async (id, userId, data) => {
  const sprint = await findSprintById(id);
  if (!sprint) {
    const error = new Error('Sprint not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(sprint.projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const error = new Error('Only project admins can update sprints');
    error.statusCode = 403;
    throw error;
  }

  return updateSprint(id, data);
};

const deleteSprintService = async (id, userId) => {
  const sprint = await findSprintById(id);
  if (!sprint) {
    const error = new Error('Sprint not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(sprint.projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const error = new Error('Only project admins can delete sprints');
    error.statusCode = 403;
    throw error;
  }

  await deleteSprint(id);
  return { message: 'Sprint deleted successfully' };
};

module.exports = {
  createSprintService,
  getSprintsByProject,
  getSprintById,
  updateSprintService,
  deleteSprintService,
};