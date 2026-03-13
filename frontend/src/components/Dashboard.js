import React, { useState } from 'react';
import ProfilePopup from './ProfilePopup';
import Sidebar from './Sidebar';
import StatsBar from './StatsBar';
import FilterBar from './FilterBar';
import ServersSection from './ServersSection';
import UsersSection from './UsersSection';
import GroupsSection from './GroupsSection';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('servers');
  const [filters, setFilters] = useState({});

  const handleNavigate = (section) => {
    setActiveSection(section);
    setFilters({});
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'servers': return <ServersSection filters={filters} />;
      case 'users': return <UsersSection filters={filters} />;
      case 'groups': return <GroupsSection />;
      default: return null;
    }
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-title">RBAC Platform</div>
        <ProfilePopup />
      </header>
      <div className="dashboard-body">
        <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />
        <main className="main-content">
          <StatsBar />
          <FilterBar
            activeSection={activeSection}
            filters={filters}
            onFilterChange={setFilters}
          />
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
