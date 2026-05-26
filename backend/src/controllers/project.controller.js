const {
  createProjectService,
  getProjectsByTeam,
  getProjectById,
  updateProjectService,
  deleteProjectService,
} = require('../services/project.service');

const {
  createProjectSchema,
  updateProjectSchema,
} = require('../validators/project.validator');

async function createProject(req, res, next) {
  try {
    const validated = createProjectSchema.parse(req.body);
    const project = await createProjectService({
      ...validated,
      createdById: req.user.id,
    });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function getProjects(req, res, next) {
  try {
    const projects = await getProjectsByTeam(req.query.teamId, req.user.id);
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await getProjectById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const validated = updateProjectSchema.parse(req.body);
    const project = await updateProjectService(req.params.id, req.user.id, validated);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const result = await deleteProjectService(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};