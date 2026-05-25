const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/auth.routes');

const app = express();

// --- Security middleware ---
// helmet sets safe HTTP headers automatically
app.use(helmet());

// cors controls which domains can call your API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// --- Body parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
// morgan logs every request to the console in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const projectRoutes = require('./src/routes/project.routes');
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — 4 parameters is what tells Express this is an error handler
app.use((err, req, res, next) => {
  // Handle Zod validation errors
  // WHY: Zod throws a ZodError with an 'issues' array describing every failed rule
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Use the statusCode we attached to the error, or fall back to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    // WHY only in development: never expose stack traces in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;