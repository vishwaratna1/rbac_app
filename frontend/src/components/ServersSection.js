import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ServersSection({ filters }) {
  const { hasPermission, getScope, user } = useAuth();

  const [servers, setServers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    group_id: '',
    status: 'active'
  });

  const scope = getScope('servers', 'read');

  const fetchServers = () => {
    const params = {};
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.created_by) params.created_by = filters.created_by;

    api.get('/api/servers', { params })
      .then(res => setServers(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchServers();
  }, [filters]);

  useEffect(() => {
    if (scope === 'all' && hasPermission('groups', 'read')) {
      api.get('/api/groups')
        .then(res => setGroups(res.data))
        .catch(() => {});
    }
  }, [scope, hasPermission]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      ip_address: '',
      group_id: scope === 'all' ? '' : user?.group?.id || '',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEdit = (server) => {
    setEditing(server);
    setForm({
      name: server.name,
      ip_address: server.ip_address,
      group_id: scope === 'all' ? server.group?.id || '' : user?.group?.id || '',
      status: server.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      group_id: scope === 'all'
        ? parseInt(form.group_id, 10)
        : user?.group?.id
    };

    if (editing) {
      await api.put(`/api/servers/${editing.id}`, payload);
    } else {
      await api.post('/api/servers', payload);
    }

    setShowModal(false);
    fetchServers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this server?')) return;

    await api.delete(`/api/servers/${id}`);
    fetchServers();
  };

  return (
    <div className="section">

      <div className="section-header">
        <h3>Servers</h3>

        {hasPermission('servers', 'create') && (
          <button className="btn-add" onClick={openAdd}>
            Add Server
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>IP Address</th>
            <th>Group</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {servers.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.ip_address}</td>
              <td>{s.group.name}</td>

              <td>
                <span className={`status-badge ${s.status}`}>
                  {s.status}
                </span>
              </td>

              <td className="actions">

                {hasPermission('servers', 'update') && (
                  <button
                    className="btn-edit"
                    onClick={() => openEdit(s)}
                  >
                    Edit
                  </button>
                )}

                {hasPermission('servers', 'delete') && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                )}

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >

            <h3>{editing ? 'Edit Server' : 'Add Server'}</h3>

            <form onSubmit={handleSubmit}>

              <input
                placeholder="Server name"
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <input
                placeholder="IP Address"
                value={form.ip_address}
                onChange={e =>
                  setForm({ ...form, ip_address: e.target.value })
                }
                required
              />

              {scope === 'all' && (
                <select
                  value={form.group_id}
                  onChange={e =>
                    setForm({
                      ...form,
                      group_id: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Select Group</option>

                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={form.status}
                onChange={e =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-add"
                >
                  Save
                </button>

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}