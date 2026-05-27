const {
  createTaskService,
  getTasksByProject,
  getTaskById,
  updateTaskService,
  deleteTaskService,
} = require('../services/task.service');

const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');

const createTask = async (req, res, next) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const task = await createTaskService(req.params.projectId, req.user.id, validatedData);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const tasks = await getTasksByProject(req.params.projectId, req.user.id);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const validatedData = updateTaskSchema.parse(req.body);
    const task = await updateTaskService(req.params.id, req.user.id, validatedData);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await deleteTaskService(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };