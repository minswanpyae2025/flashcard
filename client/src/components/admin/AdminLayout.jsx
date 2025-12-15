import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Content Manager', path: '/admin/content' },
    { label: 'Taxonomy', path: '/admin/taxonomy' },
    { label: 'Report Inbox', path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-800 text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-6 py-3 hover:bg-indigo-700 transition-colors ${
                location.pathname === item.path ? 'bg-indigo-900 border-l-4 border-white' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left px-6 py-3 hover:bg-indigo-700 transition-colors text-gray-300 mt-4 border-t border-indigo-700"
            >
              Back to App
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-6 py-3 hover:bg-red-700 transition-colors text-red-300"
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
