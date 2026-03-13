import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function StatsBar() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({ servers_count: 0, users_count: 0, groups_count: 0 });

  useEffect(() => {
    api.get('/api/servers/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="stats-bar">
      {hasPermission('servers', 'read') && (
        <div className="stat-card">
          <div className="stat-value">{stats.servers_count}</div>
          <div className="stat-label">Servers</div>
        </div>
      )}
      {hasPermission('users', 'read') && (
        <div className="stat-card">
          <div className="stat-value">{stats.users_count}</div>
          <div className="stat-label">Users</div>
        </div>
      )}
      {hasPermission('groups', 'read') && (
        <div className="stat-card">
          <div className="stat-value">{stats.groups_count}</div>
          <div className="stat-label">Groups</div>
        </div>
      )}
    </div>
  );
}
