# TaskFlow — User Stories

## Authentication

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-01 | visitor | register an account with my name, email, and password | I can access the TaskFlow platform | High |
| US-02 | registered user | log in with my email and password | I can access my teams and projects | High |
| US-03 | logged-in user | view my own profile information | I can verify my account details | Medium |

---

## Teams

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-04 | user | create a new team | I can group people around a shared project | High |
| US-05 | user | view all teams I belong to | I have a clear overview of my work | High |
| US-06 | team owner | update my team's name and description | I can keep team information accurate | Medium |
| US-07 | team owner | delete a team | I can remove teams that are no longer needed | Medium |
| US-08 | user | view the details of a team I belong to | I can see its members and projects | High |

---

## Projects

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-09 | team member | create a project inside a team | I can organize work by project | High |
| US-10 | team member | view all projects in my team | I know what projects are active | High |
| US-11 | project member | view the details of a project | I can see its sprints and tasks | High |
| US-12 | project admin | update a project's name and description | I can keep project information current | Medium |
| US-13 | project admin | delete a project | I can remove completed or cancelled projects | Low |

---

## Sprints

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-14 | project admin | create a sprint with a name, start date, and end date | I can plan an iteration of work | High |
| US-15 | project member | view all sprints in a project | I can follow the project's progress | High |
| US-16 | project member | view the details of a specific sprint | I can see which tasks belong to it | High |
| US-17 | project admin | update a sprint's details or status | I can manage the sprint lifecycle | Medium |
| US-18 | project admin | delete a sprint | I can remove incorrectly created sprints | Low |

---

## Tasks

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-19 | project member | create a task with a title, description, priority, and due date | I can track a unit of work | High |
| US-20 | project member | view all tasks in a project | I have an overview of all work items | High |
| US-21 | project member | view the details of a specific task | I can see its full description and status | High |
| US-22 | project member | update a task's status | I can track progress from todo to done | High |
| US-23 | project member | assign a task to a team member | Work is clearly distributed | High |
| US-24 | project member | add a task to a sprint | I can plan which tasks belong to an iteration | High |
| US-25 | project member | set story points on a task | I can estimate effort for planning | Medium |
| US-26 | project admin | delete a task | I can remove tasks that are no longer relevant | Low |
| US-27 | project member | create subtasks under a parent task | I can break large tasks into smaller pieces | Medium |

---

## Kanban Board

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-28 | project member | view tasks on a Kanban board grouped by status | I have a visual overview of the team's progress | High |
| US-29 | project member | move a task between columns on the board | I can update status quickly during standups | High |

---

## Backlog

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-30 | project member | view all unassigned tasks in the backlog | I can plan upcoming sprints | High |
| US-31 | project admin | move a task from the backlog into a sprint | I can populate a sprint during sprint planning | High |

---

## AI Features

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-32 | project member | request an AI breakdown of a task into subtasks | I can plan my work faster without thinking of every step myself | Medium |
| US-33 | project member | select which AI-suggested subtasks to keep | I stay in control of the final task structure | Medium |

---

## Notifications & Automation

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-34 | project member | automatically receive a Google Calendar event when a task has a due date | I never miss a deadline | Medium |
| US-35 | project member | automatically receive a Gmail notification when I am assigned to a task | I am immediately informed of new responsibilities | Medium |

---

## Sprint Summary

| Sprint | Goal | User Stories |
|--------|------|--------------|
| Sprint 1 | Core authentication and team management | US-01 to US-08 |
| Sprint 2 | Projects and sprint management | US-09 to US-18 |
| Sprint 3 | Task management and Kanban board | US-19 to US-29 |
| Sprint 4 | Backlog, AI features, and automations | US-30 to US-35 |

---

## Definition of Done

A user story is considered **done** when:

- The feature is fully implemented on both frontend and backend
- The relevant API endpoint has integration tests passing
- The code passes ESLint and Prettier checks
- The feature is committed to Git on a feature branch and merged to main
- The UI is accessible and works without errors in the browser
