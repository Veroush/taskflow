# TaskFlow — Claude Code Context

## What This Project Is
A Scrum-based project management API (like Jira) built as a portfolio project.
Full stack: React + Tailwind (frontend), Node.js + Express (backend), PostgreSQL + Prisma v6.

## Folder Structure
taskflow/
  backend/   ← all backend work lives here
  frontend/  ← not started yet

## Backend Stack
- Node.js + Express
- Prisma ORM v6 (do NOT upgrade to v7)
- PostgreSQL database named taskflow_db
- JWT auth with bcrypt
- Zod for validation
- Jest + Supertest for testing

## Architecture Pattern (strictly follow this)
Every resource has 5 layers in this order:
1. validator (Zod) → backend/src/validators/
2. repository (Prisma only) → backend/src/repositories/
3. service (business logic) → backend/src/services/
4. controller (HTTP only) → backend/src/controllers/
5. routes → backend/src/routes/

## Rules
- Never put business logic in controllers
- Never put Prisma calls outside of repositories
- Always use transactions when doing 2+ related DB writes
- All routes require the protect middleware from auth.middleware.js
- req.user.id comes from the JWT via protect middleware — never trust client for user identity
- Run npm commands from inside backend/
- Run git commands from taskflow/ root

## What's Already Built
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- Full CRUD for /api/projects (just built)
- Full CRUD for /api/teams (just built)

## What's Next
- Sprints: POST/GET /api/projects/:projectId/sprints, PATCH/DELETE /api/sprints/:id
- Tasks: POST/GET /api/projects/:projectId/tasks, GET/PATCH/DELETE /api/tasks/:id
- Frontend with React + Tailwind
- Testing with Jest + Supertest