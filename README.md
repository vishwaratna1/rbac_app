# RBAC Platform

Full-stack application with dynamic, data-driven role-based access control. React + FastAPI + PostgreSQL + Docker Compose. Permissions are stored as database rows, not hardcoded logic.

## Architecture Overview

3-tier architecture: React SPA → FastAPI REST API → PostgreSQL.

- JWT for stateless authentication
- RBAC via normalized `roles` / `permissions` / `role_permissions` tables
- Permission scope (`all` / `group` / `own`) drives query-level filtering
- Frontend renders UI dynamically from permission arrays — never checks role name strings

## Tech Stack

- **Frontend:** React 18, Axios
- **Backend:** FastAPI, SQLAlchemy, passlib (bcrypt), python-jose (JWT)
- **Database:** PostgreSQL 15
- **Infra:** Docker Compose

## Prerequisites

- Docker & Docker Compose (required)
- Node.js 18+ and Python 3.11+ (optional, for local dev without Docker)

## Quick Start

```bash
git clone <repo>
cd rbac_app
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

## Default Credentials

| User ID | Password | Role | Group |
|---------|----------|------|-------|
| admin | password123 | platform_admin | — (Global) |
| eng_admin | password123 | group_admin | Engineering |
| data_admin | password123 | group_admin | Data Team |
| eng_user1 | password123 | group_user | Engineering |
| eng_user2 | password123 | group_user | Engineering |
| data_user1 | password123 | group_user | Data Team |

## RBAC Model

Roles and permissions are stored in the database as data, not code. The system uses three tables:

1. **roles** — defines role names (`platform_admin`, `group_admin`, `group_user`)
2. **permissions** — defines (resource, action, scope) tuples
3. **role_permissions** — M:N join table linking roles to their permissions

### Permission Matrix

| Role | Groups | Users | Servers | Scope |
|------|--------|-------|---------|-------|
| platform_admin | CRUD | CRUD | CRUD | all |
| group_admin | — | CRUD | CRUD | group |
| group_user | — | — | CRUD | own |

### Scope Behavior

- **all** — no filter, see everything
- **group** — filtered to `WHERE group_id = current_user.group_id`
- **own** — filtered to `WHERE created_by = current_user.id`

### Adding a New Role

Zero code changes required. Just insert rows:

```sql
INSERT INTO roles (name, description)
VALUES ('auditor', 'Read-only access to everything');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'auditor'
  AND p.action = 'read'
  AND p.scope = 'all';
```

No redeployment needed. The new role works immediately.

## Database Schema

### roles
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| name | VARCHAR(50) | UNIQUE |
| description | VARCHAR(255) | |

### permissions
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| resource | VARCHAR(50) | users, groups, servers |
| action | VARCHAR(50) | create, read, update, delete |
| scope | VARCHAR(20) | all, group, own |
| description | VARCHAR(255) | |

UNIQUE constraint on (resource, action, scope).

### role_permissions
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| role_id | INTEGER | FK → roles |
| permission_id | INTEGER | FK → permissions |

UNIQUE constraint on (role_id, permission_id).

### groups
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| name | VARCHAR(100) | UNIQUE |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| user_id | VARCHAR(100) | UNIQUE, login identifier |
| name | VARCHAR(150) | |
| password_hash | VARCHAR(255) | bcrypt |
| role_id | INTEGER | FK → roles |
| group_id | INTEGER | FK → groups, nullable |

### servers
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| name | VARCHAR(150) | |
| ip_address | VARCHAR(45) | |
| group_id | INTEGER | FK → groups |
| created_by | INTEGER | FK → users |
| status | VARCHAR(20) | active / inactive |

## API Endpoints

### Auth
- `POST /api/auth/login` — public, returns JWT
- `GET /api/auth/me` — returns user profile + permissions array

### Users
- `GET /api/users` — list (scope-filtered)
- `GET /api/users/{id}` — get one
- `POST /api/users` — create
- `PUT /api/users/{id}` — update
- `DELETE /api/users/{id}` — delete

### Groups
- `GET /api/groups` — list
- `GET /api/groups/{id}` — get one
- `POST /api/groups` — create
- `PUT /api/groups/{id}` — update
- `DELETE /api/groups/{id}` — delete

### Servers
- `GET /api/servers` — list (scope-filtered, query params: `group_id`, `created_by`)
- `GET /api/servers/stats` — counts for servers/users/groups (scope-filtered)
- `GET /api/servers/{id}` — get one
- `POST /api/servers` — create
- `PUT /api/servers/{id}` — update
- `DELETE /api/servers/{id}` — delete

## Project Structure

```
rbac_app/
├── docker-compose.yml
├── .env
├── README.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── api/axios.js
│       ├── context/AuthContext.js
│       ├── hooks/usePermission.js
│       ├── components/
│       │   ├── Login.js
│       │   ├── Dashboard.js
│       │   ├── ProfilePopup.js
│       │   ├── Sidebar.js
│       │   ├── StatsBar.js
│       │   ├── FilterBar.js
│       │   ├── ServersSection.js
│       │   ├── UsersSection.js
│       │   └── GroupsSection.js
│       └── styles/App.css
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── database.py
        ├── models.py
        ├── schemas.py
        ├── auth.py
        ├── rbac.py
        ├── seed.py
        └── routers/
            ├── auth_router.py
            ├── users_router.py
            ├── groups_router.py
            └── servers_router.py
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| POSTGRES_DB | Database name | rbac_app |
| POSTGRES_USER | DB username | appuser |
| POSTGRES_PASSWORD | DB password | apppassword |
| DATABASE_URL | SQLAlchemy connection string | postgresql://appuser:apppassword@db:5432/rbac_app |
| SECRET_KEY | JWT signing key | (change in production) |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token TTL in minutes | 1440 |

## Local Development (Without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/rbac_app
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

Make sure a local PostgreSQL instance is running with the matching credentials.

## Key Design Decisions

- **Dynamic RBAC over hardcoded enums** — permissions as data for runtime configurability
- **JWT with role_id (not role name)** — decoupled from role naming
- **Scope-based filtering at query level** — single `check_permission` dependency, no scattered if/elif blocks
- **Frontend reads permissions array** — UI adapts automatically when roles change in the DB
- **bcrypt password hashing** — all passwords hashed before storage, including seed data
- **Docker health checks** — backend waits for DB readiness before starting
