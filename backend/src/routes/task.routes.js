const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

const projectRouter = express.Router({ mergeParams: true });
const taskRouter = express.Router();

projectRouter.use(protect);
taskRouter.use(protect);

projectRouter.post('/', createTask);
projectRouter.get('/', getTasks);

taskRouter.get('/:id', getTask);
taskRouter.patch('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);

module.exports = { projectRouter, taskRouter };