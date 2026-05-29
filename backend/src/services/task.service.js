const axios = require('axios');

const N8N_TASK_WEBHOOK = 'http://localhost:5678/webhook-test/199f7da5-f966-425f-8301-3f33cbc1ab31';

const {
  createTask,
  findTasksByProjectId,
  findTaskById,
  updateTask,
  deleteTask,
} = require('../repositories/task.repository');

const { findProjectMember } = require('../repositories/project.repository');

const createTaskService = async (projectId, userId, data) => {
  const membership = await findProjectMember(projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  const task = await createTask({ ...data, projectId, createdById: userId });

  console.log('Task created:', JSON.stringify(task));
  console.log('Due date:', task.dueDate);

  if (task.dueDate) {
    axios.post(N8N_TASK_WEBHOOK, {
      taskId: task.id,
      title: task.title,
      dueDate: task.dueDate,
      projectId: task.projectId,
    }).catch((err) => console.log('Webhook error:', err.message));
  }

  return task;
};

const getTasksByProject = async (projectId, userId) => {
  const membership = await findProjectMember(projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  return findTasksByProjectId(projectId);
};

const getTaskById = async (id, userId) => {
  const task = await findTaskById(id);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(task.projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  return task;
};

const updateTaskService = async (id, userId, data) => {
  const task = await findTaskById(id);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(task.projectId, userId);
  if (!membership) {
    const error = new Error('You are not a member of this project');
    error.statusCode = 403;
    throw error;
  }

  return updateTask(id, data);
};

const deleteTaskService = async (id, userId) => {
  const task = await findTaskById(id);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const membership = await findProjectMember(task.projectId, userId);
  if (!membership || membership.role !== 'admin') {
    const error = new Error('Only project admins can delete tasks');
    error.statusCode = 403;
    throw error;
  }

  await deleteTask(id);
  return { message: 'Task deleted successfully' };
};

module.exports = {
  createTaskService,
  getTasksByProject,
  getTaskById,
  updateTaskService,
  deleteTaskService,
};