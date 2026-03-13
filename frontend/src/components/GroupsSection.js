import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function GroupsSection() {
  const { hasPermission } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const fetchGroups = () => {
    api.get('/api/groups').then(res => setGroups(res.data)).catch(() => {});
  };

  useEffect(() => { fetchGroups(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '' });
    setShowModal(true);
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({ name: group.name });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/api/groups/${editing.id}`, form);
    } else {
      await api.post('/api/groups', form);
    }
    setShowModal(false);
    fetchGroups();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    await api.delete(`/api/groups/${id}`);
    fetchGroups();
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>Groups</h3>
        {hasPermission('groups', 'create') && (
          <button className="btn-add" onClick={openAdd}>Add Group</button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.id}>
              <td>{g.id}</td>
              <td>{g.name}</td>
              <td className="actions">
                {hasPermission('groups', 'update') && (
                  <button className="btn-edit" onClick={() => openEdit(g)}>Edit</button>
                )}
                {hasPermission('groups', 'delete') && (
                  <button className="btn-delete" onClick={() => handleDelete(g.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Group' : 'Add Group'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                placeholder="Group name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
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
