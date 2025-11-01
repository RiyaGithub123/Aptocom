import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaCoins, 
  FaFileAlt, 
  FaUniversity, 
  FaChartLine, 
  FaUser, 
  FaCog 
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/token-purchase', icon: <FaCoins />, label: 'Buy ACT Tokens' },
    { path: '/proposals', icon: <FaFileAlt />, label: 'Proposals' },
    { path: '/treasury', icon: <FaUniversity />, label: 'Treasury' },
    { path: '/analytics', icon: <FaChartLine />, label: 'Analytics' },
    { path: '/profile', icon: <FaUser />, label: 'My Profile' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {isOpen && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
