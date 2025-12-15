import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';

const AdminHome = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStats(res.data))
    .catch(err => console.error(err));
  }, [token]);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm uppercase font-bold">Total Users</div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalUsers}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-gray-500 text-sm uppercase font-bold">Active Reports</div>
          <div className="text-3xl font-bold text-red-600">{stats.activeFlags}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-sm uppercase font-bold">Questions</div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalQuestions}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-gray-500 text-sm uppercase font-bold">Flashcards</div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalFlashcards}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
