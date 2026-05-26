const { Router } = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
} = require('../controllers/team.controller');

const router = Router();

router.use(protect);

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;