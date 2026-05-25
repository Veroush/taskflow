const {
  createProject,
  findProjectsByUserId,
  findProjectById,
  findProjectMember,
  updateProject,
  deleteProject,
} = require('../repositories/project.repository');

/**
 * Create a new project.
 * The service trusts that the validator already cleaned the input.
 * The service trusts that protect middleware already set req.user.
 */
async function createProjectService({ name, description, teamId, createdById }) {
  const project = await createProject({ name, description, teamId, createdById });
  return project;
}

/**
 * Get all projects the user belongs to.
 */
async function getUserProjects(userId) {
  return findProjectsByUserId(userId);
}

/**
 * Get a single project — but only if the requesting user is a member.
 * This is an AUTHORIZATION check: "are you allowed to see this?"
 */
async function getProjectById(projectId, userId) {
  const project = await findProjectById(projectId);

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // Check membership — non-members cannot view the project
  const membership = await findProjectMember(projectId, userId);
  if (!membership) {
    const err = new Error('You do not have access to this project');
    err.statusCode = 403;
    throw err;
  }

  return project;
}

/**
 * Update a project — only admins of the project can do this.
 */
async function updateProjectService(projectId, userId, data) {
  // First confirm the project exists
  const project = await findProjectById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // Then confirm the user is an admin
  const membership = await findProjectMember(projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const err = new Error('Only project admins can update this project');
    err.statusCode = 403;
    throw err;
  }

  return updateProject(projectId, data);
}

/**
 * Delete a project — only the creator (admin) can do this.
 */
async function deleteProjectService(projectId, userId) {
  const project = await findProjectById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const membership = await findProjectMember(projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const err = new Error('Only project admins can delete this project');
    err.statusCode = 403;
    throw err;
  }

  await deleteProject(projectId);
  return { message: 'Project deleted successfully' };
}

module.exports = {
  createProjectService,
  getUserProjects,
  getProjectById,
  updateProjectService,
  deleteProjectService,
};