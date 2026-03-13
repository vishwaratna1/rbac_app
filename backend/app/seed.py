from sqlalchemy.orm import Session
from .models import Role, Permission, RolePermission, Group, User, Server
from .auth import hash_password

ACTIONS = ["create", "read", "update", "delete"]


def run_seed(db: Session):
    # skip if any table already has data
    if db.query(Role).first() or db.query(Group).first() or db.query(User).first():
        return

    # roles
    platform_admin = Role(name="platform_admin", description="Full access to all resources across all groups")
    group_admin = Role(name="group_admin", description="Manage users and servers within assigned group")
    group_user = Role(name="group_user", description="Manage only self-created servers")
    db.add_all([platform_admin, group_admin, group_user])
    db.flush()

    # permissions — scope:all for all three resources
    all_perms = []
    for resource in ["groups", "users", "servers"]:
        for action in ACTIONS:
            p = Permission(resource=resource, action=action, scope="all")
            all_perms.append(p)
            db.add(p)

    # scope:group for users and servers
    group_perms = []
    for resource in ["users", "servers"]:
        for action in ACTIONS:
            p = Permission(resource=resource, action=action, scope="group")
            group_perms.append(p)
            db.add(p)

    # scope:own for servers only
    own_perms = []
    for action in ACTIONS:
        p = Permission(resource="servers", action=action, scope="own")
        own_perms.append(p)
        db.add(p)

    db.flush()

    # role_permissions mappings
    for p in all_perms:
        db.add(RolePermission(role_id=platform_admin.id, permission_id=p.id))
    for p in group_perms:
        db.add(RolePermission(role_id=group_admin.id, permission_id=p.id))
    for p in own_perms:
        db.add(RolePermission(role_id=group_user.id, permission_id=p.id))

    # groups
    engineering = Group(name="Engineering")
    data_team = Group(name="Data Team")
    security = Group(name="Security")
    db.add_all([engineering, data_team, security])
    db.flush()

    hashed = hash_password("password123")

    # users
    admin = User(user_id="admin", name="Platform Admin", password_hash=hashed, role_id=platform_admin.id, group_id=None)
    eng_admin = User(user_id="eng_admin", name="Eng Group Admin", password_hash=hashed, role_id=group_admin.id, group_id=engineering.id)
    data_admin = User(user_id="data_admin", name="Data Group Admin", password_hash=hashed, role_id=group_admin.id, group_id=data_team.id)
    eng_user1 = User(user_id="eng_user1", name="Alice Engineer", password_hash=hashed, role_id=group_user.id, group_id=engineering.id)
    eng_user2 = User(user_id="eng_user2", name="Bob Engineer", password_hash=hashed, role_id=group_user.id, group_id=engineering.id)
    data_user1 = User(user_id="data_user1", name="Carol Data", password_hash=hashed, role_id=group_user.id, group_id=data_team.id)
    db.add_all([admin, eng_admin, data_admin, eng_user1, eng_user2, data_user1])
    db.flush()

    # servers
    db.add_all([
        Server(name="web-prod-01", ip_address="10.0.1.10", group_id=engineering.id, created_by=eng_user1.id, status="active"),
        Server(name="api-staging", ip_address="10.0.2.15", group_id=engineering.id, created_by=eng_user2.id, status="active"),
        Server(name="ml-gpu-01", ip_address="10.0.3.20", group_id=data_team.id, created_by=data_user1.id, status="active"),
        Server(name="db-primary", ip_address="10.0.3.5", group_id=data_team.id, created_by=data_admin.id, status="active"),
        Server(name="auth-service", ip_address="10.0.4.10", group_id=security.id, created_by=admin.id, status="active"),
    ])

    db.commit()
