from dataclasses import dataclass
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import Permission, RolePermission, User
from .auth import get_current_user


@dataclass
class PermissionContext:
    user: User
    scope: str


def check_permission(resource: str, action: str):
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> PermissionContext:
        perm = db.query(Permission).join(RolePermission).filter(
            RolePermission.role_id == current_user.role_id,
            Permission.resource == resource,
            Permission.action == action
        ).first()

        if not perm:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        return PermissionContext(user=current_user, scope=perm.scope)
    return dependency
