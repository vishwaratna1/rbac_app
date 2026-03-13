from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Permission, RolePermission
from ..auth import verify_password, create_access_token, get_current_user
from ..schemas import LoginRequest, TokenResponse, MeResponse, PermissionOut, RoleOut, GroupOut

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == body.user_id).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid user_id or password")

    token_data = {
        "sub": user.user_id,
        "user_db_id": user.id,
        "role_id": user.role_id,
        "role_name": user.role.name,
        "group_id": user.group_id,
        "name": user.name,
    }
    return {"access_token": create_access_token(token_data)}


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    perms = db.query(Permission).join(RolePermission).filter(
        RolePermission.role_id == current_user.role_id
    ).all()

    return MeResponse(
        id=current_user.id,
        user_id=current_user.user_id,
        name=current_user.name,
        role=RoleOut(id=current_user.role.id, name=current_user.role.name),
        group=GroupOut(id=current_user.group.id, name=current_user.group.name) if current_user.group else None,
        permissions=[PermissionOut(resource=p.resource, action=p.action, scope=p.scope) for p in perms],
    )
