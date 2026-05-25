const {
  createProjectSchema,
  updateProjectSchema,
} = require('../validators/project.validator');

const {
  createProjectService,
  getUserProjects,
  getProjectById,
  updateProjectService,
  deleteProjectService,
} = require('../services/project.service');

async function createProject(req, res, next) {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await createProjectService({
      ...data,
      createdById: req.user.id, // comes from JWT via protect middleware
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

async function getProjects(req, res, next) {
  try {
    const projects = await getUserProjects(req.user.id);
    res.status(200).json({ projects });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await getProjectById(req.params.id, req.user.id);
    res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const data = updateProjectSchema.parse(req.body);
    const project = await updateProjectService(req.params.id, req.user.id, data);
    res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const result = await deleteProjectService(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };