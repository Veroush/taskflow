const jwt = require('jsonwebtoken');
const { findUserById } = require('../repositories/user.repository');

/**
 * Middleware: protect a route by requiring a valid JWT.
 *
 * Usage in a route file:
 *   router.get('/me', protect, myController)
 *
 * After this runs successfully, req.user is the logged-in user.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract the token from the Authorization header
    // WHY "Bearer": industry standard format is "Bearer <token>"
    // "Bearer" means "the entity bearing (presenting) this token"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided. Please log in.');
      error.statusCode = 401;
      throw error;
    }

    // "Bearer eyJhbGc..." → we split on the space and take index [1]
    const token = authHeader.split(' ')[1];

    // 2. Verify the token
    // WHY jwt.verify and not jwt.decode:
    // decode() just reads the payload without checking the signature.
    // verify() checks that our JWT_SECRET signed it AND it hasn't expired.
    // A forged or tampered token will throw here.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Load the user from the database
    const user = await findUserById(decoded.userId);

    if (!user) {
      const error = new Error('User no longer exists');
      error.statusCode = 401;
      throw error;
    }

    // 4. Attach user to the request — available to all downstream handlers
    req.user = user;

    // 5. Hand control to the next middleware or controller
    next();
  } catch (error) {
    // Give clear messages for JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      error.message = 'Invalid token. Please log in again.';
      error.statusCode = 401;
    }
    if (error.name === 'TokenExpiredError') {
      error.message = 'Your session has expired. Please log in again.';
      error.statusCode = 401;
    }
    next(error);
  }
};

module.exports = { protect };