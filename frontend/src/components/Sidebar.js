import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { key: 'servers', label: 'Servers', resource: 'servers' },
  { key: 'users', label: 'Users', resource: 'users' },
  { key: 'groups', label: 'Groups', resource: 'groups' },
];

export default function Sidebar({ activeSection, onNavigate }) {
  const { hasPermission } = useAuth();

  return (
    <nav className="sidebar">
      {NAV_ITEMS.filter(item => hasPermission(item.resource, 'read')).map(item => (
        <button
          key={item.key}
          className={`nav-item ${activeSection === item.key ? 'active' : ''}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
