from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Server, User, Group, Permission, RolePermission
from ..schemas import ServerOut, ServerCreate, ServerUpdate, StatsResponse
from ..rbac import check_permission, PermissionContext
from ..auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[ServerOut])
def list_servers(
    group_id: Optional[int] = None,
    created_by: Optional[int] = None,
    ctx: PermissionContext = Depends(check_permission("servers", "read")),
    db: Session = Depends(get_db)
):
    query = db.query(Server)
    if ctx.scope == "group":
        query = query.filter(Server.group_id == ctx.user.group_id)
    elif ctx.scope == "own":
        query = query.filter(Server.created_by == ctx.user.id)

    if group_id and ctx.scope == "all":
        query = query.filter(Server.group_id == group_id)
    if created_by and ctx.scope in ("all", "group"):
        query = query.filter(Server.created_by == created_by)

    return query.all()


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # figure out what this user can see for each resource
    def count_resource(resource, model, group_field="group_id"):
        perm = db.query(Permission).join(RolePermission).filter(
            RolePermission.role_id == current_user.role_id,
            Permission.resource == resource,
            Permission.action == "read"
        ).first()
        if not perm:
            return 0
        q = db.query(model)
        if perm.scope == "group" and group_field:
            q = q.filter(getattr(model, group_field) == current_user.group_id)
        elif perm.scope == "own":
            q = q.filter(model.created_by == current_user.id)
        return q.count()

    return StatsResponse(
        servers_count=count_resource("servers", Server),
        users_count=count_resource("users", User),
        groups_count=count_resource("groups", Group, group_field=None),
    )


@router.get("/{server_id}", response_model=ServerOut)
def get_server(
    server_id: int,
    ctx: PermissionContext = Depends(check_permission("servers", "read")),
    db: Session = Depends(get_db)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if ctx.scope == "group" and server.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ctx.scope == "own" and server.created_by != ctx.user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return server


@router.post("", response_model=ServerOut, status_code=201)
def create_server(
    body: ServerCreate,
    ctx: PermissionContext = Depends(check_permission("servers", "create")),
    db: Session = Depends(get_db)
):
    if ctx.scope == "group" and body.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Can only create servers in your own group")

    server = Server(
        name=body.name,
        ip_address=body.ip_address,
        group_id=body.group_id if ctx.scope != "own" else ctx.user.group_id,
        created_by=ctx.user.id,
        status=body.status,
    )
    db.add(server)
    db.commit()
    db.refresh(server)
    return server


@router.put("/{server_id}", response_model=ServerOut)
def update_server(
    server_id: int,
    body: ServerUpdate,
    ctx: PermissionContext = Depends(check_permission("servers", "update")),
    db: Session = Depends(get_db)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if ctx.scope == "group" and server.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ctx.scope == "own" and server.created_by != ctx.user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        server.name = body.name
    if body.ip_address is not None:
        server.ip_address = body.ip_address
    if body.group_id is not None:
        server.group_id = body.group_id
    if body.status is not None:
        server.status = body.status

    db.commit()
    db.refresh(server)
    return server


@router.delete("/{server_id}", status_code=204)
def delete_server(
    server_id: int,
    ctx: PermissionContext = Depends(check_permission("servers", "delete")),
    db: Session = Depends(get_db)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    if ctx.scope == "group" and server.group_id != ctx.user.group_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ctx.scope == "own" and server.created_by != ctx.user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(server)
    db.commit()
