from pydantic import BaseModel
from typing import Optional, List


class LoginRequest(BaseModel):
    user_id: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class GroupOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class GroupCreate(BaseModel):
    name: str


class GroupUpdate(BaseModel):
    name: str


class PermissionOut(BaseModel):
    resource: str
    action: str
    scope: str
    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    id: int
    user_id: str
    name: str
    role: RoleOut
    group: Optional[GroupOut] = None
    permissions: List[PermissionOut]


class UserOut(BaseModel):
    id: int
    user_id: str
    name: str
    role: RoleOut
    group: Optional[GroupOut] = None
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    user_id: str
    name: str
    password: str
    role_id: int
    group_id: Optional[int] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    group_id: Optional[int] = None


class ServerOut(BaseModel):
    id: int
    name: str
    ip_address: str
    group: GroupOut
    created_by: int
    status: str
    model_config = {"from_attributes": True}


class ServerCreate(BaseModel):
    name: str
    ip_address: str
    group_id: int
    status: str = "active"


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    group_id: Optional[int] = None
    status: Optional[str] = None


class StatsResponse(BaseModel):
    servers_count: int
    users_count: int
    groups_count: int
