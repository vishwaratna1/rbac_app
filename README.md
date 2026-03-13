# RBAC Platform

Full-stack app with dynamic, data-driven role-based access control. Roles and permissions live in the database — no hardcoded logic. The UI and API both adapt automatically based on what a user's role permits.

## Tech Stack

- **Frontend:** React 18, Axios
- **Backend:** FastAPI, SQLAlchemy, python-jose (JWT), passlib (bcrypt)
- **Database:** PostgreSQL 15
- **Infra:** Docker Compose

## Getting Started

```bash
git clone https://github.com/vishwaratna1/rbac_app.git
cd rbac_app
cp .env.example .env
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

### Default Credentials

| User ID | Password | Role | Group |
|---------|----------|------|-------|
| admin | password123 | platform_admin | — |
| eng_admin | password123 | group_admin | Engineering |
| data_admin | password123 | group_admin | Data Team |
| eng_user1 | password123 | group_user | Engineering |
| eng_user2 | password123 | group_user | Engineering |
| data_user1 | password123 | group_user | Data Team |

## API Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

### Groups
- `GET /api/groups`
- `POST /api/groups`
- `PUT /api/groups/{id}`
- `DELETE /api/groups/{id}`

### Servers
- `GET /api/servers`
- `POST /api/servers`
- `PUT /api/servers/{id}`
- `DELETE /api/servers/{id}`
- `GET /api/servers/stats`

## Project Structure

```
rbac_app/
├── docker-compose.yml
├── .env.example
├── frontend/
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.js
│       ├── hooks/usePermission.js
│       └── components/
│           ├── Login.js
│           ├── Dashboard.js
│           ├── Sidebar.js
│           ├── ServersSection.js
│           ├── UsersSection.js
│           └── GroupsSection.js
└── backend/
    └── app/
        ├── main.py
        ├── models.py
        ├── rbac.py
        ├── seed.py
        └── routers/
            ├── auth_router.py
            ├── users_router.py
            ├── groups_router.py
            └── servers_router.py
```
