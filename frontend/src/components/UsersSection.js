import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function UsersSection({ filters }) {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ user_id: '', name: '', password: '', role_id: '', group_id: '' });

  const fetchUsers = () => {
    const params = {};
    if (filters.group_id) params.group_id = filters.group_id;
    api.get('/api/users', { params }).then(res => setUsers(res.data)).catch(() => {});
  };

  useEffect(() => { fetchUsers(); }, [filters]);
  useEffect(() => {
    api.get('/api/groups').then(res => setGroups(res.data)).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ user_id: '', name: '', password: '', role_id: '', group_id: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      user_id: user.user_id,
      name: user.name,
      password: '',
      role_id: user.role.id,
      group_id: user.group ? user.group.id : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      role_id: parseInt(form.role_id),
      group_id: form.group_id ? parseInt(form.group_id) : null,
    };

    if (editing) {
      if (form.password) payload.password = form.password;
      await api.put(`/api/users/${editing.id}`, payload);
    } else {
      payload.user_id = form.user_id;
      payload.password = form.password;
      await api.post('/api/users', payload);
    }
    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/api/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>Users</h3>
        {hasPermission('users', 'create') && (
          <button className="btn-add" onClick={openAdd}>Add User</button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Group</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.user_id}</td>
              <td>{u.name}</td>
              <td>{u.role.name}</td>
              <td>{u.group ? u.group.name : '—'}</td>
              <td className="actions">
                {hasPermission('users', 'update') && (
                  <button className="btn-edit" onClick={() => openEdit(u)}>Edit</button>
                )}
                {hasPermission('users', 'delete') && (
                  <button className="btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit User' : 'Add User'}</h3>
            <form onSubmit={handleSubmit}>
              {!editing && (
                <input
                  placeholder="User ID"
                  value={form.user_id}
                  onChange={e => setForm({ ...form, user_id: e.target.value })}
                  required
                />
              )}
              <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editing}
              />
              <select
                value={form.role_id}
                onChange={e => setForm({ ...form, role_id: e.target.value })}
                required
              >
                <option value="">Select Role</option>
                <option value="1">platform_admin</option>
                <option value="2">group_admin</option>
                <option value="3">group_user</option>
              </select>
              <select
                value={form.group_id}
                onChange={e => setForm({ ...form, group_id: e.target.value })}
              >
                <option value="">No Group (Global)</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <div className="modal-actions">
                <button type="submit" className="btn-add">Save</button>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
