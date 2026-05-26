const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createSprint,
  getSprints,
  getSprint,
  updateSprint,
  deleteSprint,
} = require('../controllers/sprint.controller');

const projectRouter = express.Router({ mergeParams: true });
const sprintRouter = express.Router();

projectRouter.use(protect);
sprintRouter.use(protect);

projectRouter.post('/', createSprint);
projectRouter.get('/', getSprints);

sprintRouter.get('/:id', getSprint);
sprintRouter.patch('/:id', updateSprint);
sprintRouter.delete('/:id', deleteSprint);

module.exports = { projectRouter, sprintRouter };