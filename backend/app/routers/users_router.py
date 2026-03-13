from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserOut, UserCreate, UserUpdate
from ..rbac import check_permission, PermissionContext
from ..auth import hash_password

router = APIRouter()


@router.get("", response_model=list[UserOut])
def list_users(
    group_id: Optional[int] = None,
    ctx: PermissionContext = Depends(check_permission("users", "read")),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if ctx.scope == "group":
        query = query.filter(User.group_id == ctx.user.group_id)
    if group_id and ctx.scope == "all":
        query = query.filter(User.group_id == group_id)
    return query.all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    ctx: PermissionContext = Depends(check_permission("users", "read")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if ctx.scope == "group" and user.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return user


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    body: UserCreate,
    ctx: PermissionContext = Depends(check_permission("users", "create")),
    db: Session = Depends(get_db)
):
    if ctx.scope == "group" and body.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Can only create users in your own group")

    existing = db.query(User).filter(User.user_id == body.user_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="user_id already exists")

    user = User(
        user_id=body.user_id,
        name=body.name,
        password_hash=hash_password(body.password),
        role_id=body.role_id,
        group_id=body.group_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    ctx: PermissionContext = Depends(check_permission("users", "update")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if ctx.scope == "group" and user.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        user.name = body.name
    if body.password is not None:
        user.password_hash = hash_password(body.password)
    if body.role_id is not None:
        user.role_id = body.role_id
    if body.group_id is not None:
        user.group_id = body.group_id

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    ctx: PermissionContext = Depends(check_permission("users", "delete")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if ctx.scope == "group" and user.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(user)
    db.commit()
