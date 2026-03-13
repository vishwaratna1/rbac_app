import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePopup() {
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef(null);

  const showPopup = () => {
    clearTimeout(hideTimeout.current);
    setVisible(true);
  };

  const scheduleHide = () => {
    hideTimeout.current = setTimeout(() => setVisible(false), 150);
  };

  useEffect(() => {
    return () => clearTimeout(hideTimeout.current);
  }, []);

  return (
    <div className="profile-trigger" onMouseEnter={showPopup} onMouseLeave={scheduleHide}>
      <span className="profile-name">{user.name}</span>
      {visible && (
        <div className="profile-popup" onMouseEnter={showPopup} onMouseLeave={scheduleHide}>
          <div className="profile-row"><span>User ID</span><span>{user.user_id}</span></div>
          <div className="profile-row"><span>Name</span><span>{user.name}</span></div>
          <div className="profile-row"><span>Group</span><span>{user.group ? user.group.name : 'Global'}</span></div>
          <div className="profile-row"><span>Role</span><span>{user.role.name}</span></div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}
