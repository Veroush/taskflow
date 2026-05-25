const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/auth/register
// No 'protect' here — you can't require a token to create an account
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me — protected route example
// WHY: 'protect' runs first. Invalid token = stops here with 401.
// Valid token = req.user is set, controller runs.
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = router;