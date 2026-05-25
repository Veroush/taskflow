const { registerUser, loginUser } = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // Validate first — .parse() throws a ZodError if anything is wrong.
    // That ZodError gets caught below and forwarded to the global error handler.
    const validatedData = registerSchema.parse(req.body);

    const { user, token } = await registerUser(validatedData);

    // WHY 201 and not 200:
    // 200 = "OK, request succeeded"
    // 201 = "OK, and a new resource was created"
    // Using the right status code shows you understand HTTP semantics.
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error); // forward to global error handler in app.js
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { user, token } = await loginUser(validatedData);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };