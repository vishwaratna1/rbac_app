import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function FilterBar({ activeSection, filters, onFilterChange }) {
  const { getScope, hasPermission } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);

  const scope = getScope(activeSection, 'read');

  useEffect(() => {
    if (scope === 'all' && hasPermission('groups', 'read')) {
      api.get('/api/groups').then(res => setGroups(res.data)).catch(() => {});
    }
    if ((scope === 'all' || scope === 'group') && hasPermission('users', 'read')) {
      api.get('/api/users').then(res => setUsers(res.data)).catch(() => {});
    }
  }, [scope, hasPermission, activeSection]);

  if (scope === 'own') return null;

  return (
    <div className="filter-bar">
      {scope === 'all' && (
        <select
          value={filters.group_id || ''}
          onChange={e => onFilterChange({ ...filters, group_id: e.target.value || null })}
        >
          <option value="">All Groups</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      )}
      {(scope === 'all' || scope === 'group') && activeSection === 'servers' && (
        <select
          value={filters.created_by || ''}
          onChange={e => onFilterChange({ ...filters, created_by: e.target.value || null })}
        >
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
