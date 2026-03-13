from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from .database import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String(255))
    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True)
    resource = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    scope = Column(String(20), nullable=False)
    description = Column(String(255))
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("resource", "action", "scope"),)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")
    __table_args__ = (UniqueConstraint("role_id", "permission_id"),)


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    users = relationship("User", back_populates="group")
    servers = relationship("Server", back_populates="group", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    user_id = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True, index=True)
    role = relationship("Role", back_populates="users")
    group = relationship("Group", back_populates="users")
    servers_created = relationship("Server", back_populates="creator", cascade="all, delete-orphan")


class Server(Base):
    __tablename__ = "servers"
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    ip_address = Column(String(45), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="active")
    group = relationship("Group", back_populates="servers")
    creator = relationship("User", back_populates="servers_created")
