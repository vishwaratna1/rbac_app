from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Group
from ..schemas import GroupOut, GroupCreate, GroupUpdate
from ..rbac import check_permission, PermissionContext

router = APIRouter()


@router.get("", response_model=list[GroupOut])
def list_groups(
    ctx: PermissionContext = Depends(check_permission("groups", "read")),
    db: Session = Depends(get_db)
):
    return db.query(Group).all()


@router.get("/{group_id}", response_model=GroupOut)
def get_group(
    group_id: int,
    ctx: PermissionContext = Depends(check_permission("groups", "read")),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("", response_model=GroupOut, status_code=201)
def create_group(
    body: GroupCreate,
    ctx: PermissionContext = Depends(check_permission("groups", "create")),
    db: Session = Depends(get_db)
):
    group = Group(name=body.name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    body: GroupUpdate,
    ctx: PermissionContext = Depends(check_permission("groups", "update")),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.name = body.name
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    ctx: PermissionContext = Depends(check_permission("groups", "delete")),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
