const { Router } = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');

const router = Router();

// All project routes require authentication
router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;