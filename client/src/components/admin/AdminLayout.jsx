import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Logo from '../Logo';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Content Manager', path: '/admin/content' },
    { label: 'Taxonomy', path: '/admin/taxonomy' },
    { label: 'Report Inbox', path: '/admin/reports' },
    { label: 'User Access', path: '/admin/users' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-gradient text-white flex-shrink-0 shadow-lg">
        <div className="p-6">
          <Logo className="text-white drop-shadow-md" />
          <div className="text-xs text-brand-gold mt-2 font-bold uppercase tracking-wider">Admin Panel</div>
        </div>
        <nav className="mt-6">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
               className={`w-full text-left px-6 py-3 hover:bg-white/10 transition-colors ${
                 location.pathname === item.path ? 'bg-white/20 border-l-4 border-brand-gold font-bold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
              onClick={() => navigate('/dashboard')}
               className="w-full text-left px-6 py-3 hover:bg-white/10 transition-colors text-gray-100 mt-4 border-t border-white/20"
            >
              Back to App
          </button>
          <button
            onClick={logout}
             className="w-full text-left px-6 py-3 hover:bg-red-600/80 transition-colors text-red-100"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
