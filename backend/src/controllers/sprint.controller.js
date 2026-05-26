const {
  createSprintService,
  getSprintsByProject,
  getSprintById,
  updateSprintService,
  deleteSprintService,
} = require('../services/sprint.service');

const { createSprintSchema, updateSprintSchema } = require('../validators/sprint.validator');

const createSprint = async (req, res, next) => {
  try {
    const validatedData = createSprintSchema.parse(req.body);
    const sprint = await createSprintService(req.params.projectId, req.user.id, validatedData);
    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

const getSprints = async (req, res, next) => {
  try {
    const sprints = await getSprintsByProject(req.params.projectId, req.user.id);
    res.status(200).json({ success: true, data: sprints });
  } catch (error) {
    next(error);
  }
};

const getSprint = async (req, res, next) => {
  try {
    const sprint = await getSprintById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

const updateSprint = async (req, res, next) => {
  try {
    const validatedData = updateSprintSchema.parse(req.body);
    const sprint = await updateSprintService(req.params.id, req.user.id, validatedData);
    res.status(200).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

const deleteSprint = async (req, res, next) => {
  try {
    const result = await deleteSprintService(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSprint, getSprints, getSprint, updateSprint, deleteSprint };