# TaskFlow

A professional Scrum-based project management platform inspired by Jira, Linear, and Asana. Built as a full-stack portfolio project to demonstrate professional software engineering practices including object-oriented programming, UML/ERD modeling, Agile/Scrum methodology, clean architecture, automated testing, CI-ready workflows, and AI-assisted development.

## 🚀 Live Demo

**Frontend:** https://veroush.github.io/taskflow/

**Backend API:** https://taskflow-126l.onrender.com

> **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take up to a minute while the service wakes up.

---

## Features

- **Authentication** — JWT-based register and login with bcrypt password hashing
- **Teams** — Create teams, manage members, role-based access (owner / member)
- **Projects** — Scrum projects per team with role-based access (admin / member)
- **Sprints** — Full sprint lifecycle: planned → active → completed
- **Tasks** — Full CRUD with status (todo / in_progress / in_review / done), priority, story points, due dates, assignees, and subtasks
- **Kanban Board** — Drag-and-drop task management by status
- **Backlog** — Manage unassigned tasks and add them to sprints
- **AI Task Breakdown** — Powered by Anthropic Claude: breaks any task into 3–6 actionable subtasks
- **Automation** — n8n workflows: task due date → Google Calendar event, task assigned → Gmail notification
- **Code Quality** — ESLint, Prettier, Zod validation on all inputs
- **72 Integration Tests** — All passing, covering auth, teams, projects, sprints, and tasks

---

## Production Features

- Responsive React frontend
- RESTful Express API
- JWT Authentication
- Password hashing using bcrypt
- PostgreSQL relational database
- Prisma ORM with migrations
- Environment-based configuration
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation with Zod
- Layered backend architecture
- Automated integration testing
- Production deployment

---

## Built With

- React 19
- Vite
- Tailwind CSS v4
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Zod
- Jest
- Supertest
- Anthropic Claude API
- GitHub Pages
- Render

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS v4, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Prisma ORM v6 |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Testing | Jest, Supertest |
| AI | Anthropic Claude API (claude-haiku-4-5-20251001) |
| Automation | n8n (self-hosted) |
| Code Quality | ESLint, Prettier |
| Version Control | Git, GitHub |
| Deployment | GitHub Pages (frontend), Render (backend + database) |

---

## Architecture

TaskFlow follows a clean layered architecture on the backend:

```
Request → Route → Middleware → Controller → Service → Repository → Database
```

### High-Level System Architecture

```
             GitHub Pages
          (React + Vite Frontend)
                   │
             HTTPS REST API
                   │
             Express.js Backend
                   │
          Prisma ORM Repository
                   │
          PostgreSQL Database
                   │
    Anthropic API / n8n Integrations
```

The frontend is completely separated from the backend and communicates exclusively through REST endpoints. Business logic is isolated within the service layer while database access is abstracted through repositories using Prisma ORM.

- **Routes** — Define endpoints and apply middleware
- **Controllers** — Parse requests, call services, return responses
- **Services** — Business logic and authorization rules
- **Repositories** — All database queries via Prisma
- **Validators** — Zod schemas validate all incoming data

---

## Project Structure

```
taskflow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # 11 models: User, Team, Project, Sprint, Task, etc.
│   ├── src/
│   │   ├── config/              # Shared Prisma client
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── repositories/        # Database access
│   │   ├── validators/          # Zod schemas
│   │   ├── middleware/          # JWT auth middleware
│   │   └── routes/              # Express routers
│   └── tests/
│       └── integration/         # 72 passing tests
└── frontend/
    └── src/
        ├── pages/               # React page components
        ├── components/          # Shared UI components
        └── services/            # Axios API client
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/teams | Create team |
| GET | /api/teams | List my teams |
| GET | /api/teams/:id | Get team details |
| PATCH | /api/teams/:id | Update team (owner only) |
| DELETE | /api/teams/:id | Delete team (owner only) |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create project |
| GET | /api/projects?teamId= | List projects in team |
| GET | /api/projects/:id | Get project |
| PATCH | /api/projects/:id | Update project (admin only) |
| DELETE | /api/projects/:id | Delete project (admin only) |

### Sprints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:projectId/sprints | Create sprint (admin only) |
| GET | /api/projects/:projectId/sprints | List sprints |
| GET | /api/sprints/:id | Get sprint |
| PATCH | /api/sprints/:id | Update sprint (admin only) |
| DELETE | /api/sprints/:id | Delete sprint (admin only) |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:projectId/tasks | Create task |
| GET | /api/projects/:projectId/tasks | List tasks |
| GET | /api/tasks/:id | Get task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task (admin only) |
| POST | /api/tasks/:taskId/breakdown | AI subtask suggestions |

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/taskflow.git
cd taskflow

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow_db
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/taskflow_test
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Production Environment Variables

The backend requires the following environment variables in production:

```env
NODE_ENV=production
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=https://veroush.github.io
ANTHROPIC_API_KEY=
```

### Database Setup

```bash
cd backend
npx prisma migrate dev
```

### Running the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — n8n automations (optional)
npx n8n
```

### Running Tests

```bash
cd backend
npm test -- --runInBand --forceExit
```

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | GitHub Pages |
| Backend API | Render |
| Database | Render PostgreSQL |

The frontend is deployed as a static React application using GitHub Pages, while the Express backend and PostgreSQL database are hosted on Render. Authentication is handled using JWTs, and the frontend communicates with the backend through a REST API over HTTPS.

---

## Scrum Process

This project was built following Scrum methodology:

- **Product Backlog** — Full feature list broken into user stories
- **Sprints** — Development organized into iterative sprints
- **User Stories** — Each feature defined as: *As a [user], I want to [action] so that [benefit]*
- **Definition of Done** — Feature complete, tested, and committed to Git

### Sample User Stories

| As a... | I want to... | So that... |
|---------|-------------|------------|
| Developer | Register an account | I can access the platform |
| Team lead | Create a project under my team | I can organize work |
| Developer | Create tasks in a sprint | I can track my work |
| Team lead | Assign tasks to team members | Work is clearly distributed |
| Developer | Use AI to break down a task | I can plan my work faster |
| Team lead | See tasks on a Kanban board | I have a clear overview of progress |

---

## Testing

72 integration tests covering all API endpoints:

```
✓ auth.test.js      — 11 tests  (register, login, /me)
✓ teams.test.js     — 14 tests  (full CRUD)
✓ projects.test.js  — 15 tests  (full CRUD)
✓ sprints.test.js   — 15 tests  (full CRUD, nested routes)
✓ tasks.test.js     — 17 tests  (full CRUD, AI breakdown)
```

---

## AI-Assisted Development

This project was built using AI tools as part of the development workflow:

- **GitHub Copilot** — Autocomplete and code generation inside VS Code
- **Claude (Anthropic)** — Architecture guidance, code review, and mentoring throughout development
- **Anthropic API** — Powers the in-app AI task breakdown feature

---

## Future Improvements

- Email verification
- Password reset functionality
- Real-time collaboration with WebSockets
- Activity timeline
- File attachments
- Sprint burndown charts
- Advanced search and filtering
- Docker support
- CI/CD with GitHub Actions
- Kubernetes deployment

---

## Author

Developed by **Veroush** as a portfolio project to demonstrate professional full-stack software engineering practices.

This project showcases:

- React + Vite frontend development
- Node.js & Express backend development
- PostgreSQL database design
- Prisma ORM
- JWT authentication
- Clean layered architecture
- REST API design
- Scrum-based project planning
- Integration testing with Jest & Supertest
- AI-powered features using Anthropic Claude
- Production deployment on GitHub Pages and Render

---

## License

This project is intended for educational and portfolio purposes.
