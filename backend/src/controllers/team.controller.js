const { createTeamSchema, updateTeamSchema } = require('../validators/team.validator');
const {
  createTeamService,
  getUserTeams,
  getTeamById,
  updateTeamService,
  deleteTeamService,
} = require('../services/team.service');

async function createTeam(req, res, next) {
  try {
    const data = createTeamSchema.parse(req.body);
    const team = await createTeamService({ ...data, ownerId: req.user.id });
    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
}

async function getTeams(req, res, next) {
  try {
    const teams = await getUserTeams(req.user.id);
    res.status(200).json({ teams });
  } catch (err) {
    next(err);
  }
}

async function getTeam(req, res, next) {
  try {
    const team = await getTeamById(req.params.id, req.user.id);
    res.status(200).json({ team });
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const data = updateTeamSchema.parse(req.body);
    const team = await updateTeamService(req.params.id, req.user.id, data);
    res.status(200).json({ team });
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const result = await deleteTeamService(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createTeam, getTeams, getTeam, updateTeam, deleteTeam };