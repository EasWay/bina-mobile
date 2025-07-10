import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Package, Users, User } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/sales', label: 'Sales', icon: BarChart3 },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/kyc', label: 'KYC', icon: Users },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default BottomNav;