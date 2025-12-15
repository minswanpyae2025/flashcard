import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const StatsView = ({ onBack }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/stats', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setStats(res.data);
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="text-center py-20">Loading stats...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">Back to Dashboard</button>

        <h1 className="text-3xl font-bold mb-8">Your Performance</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-gray-500 text-sm uppercase font-bold mb-2">Total Questions Attempted</h2>
            <div className="text-4xl font-bold text-indigo-600">{stats.totalAttempts}</div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Breakdown by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.byModule.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {/* Could put an icon here */}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.module}</h3>
                    <div className="flex items-end space-x-2 mb-2">
                        <span className="text-3xl font-bold text-gray-800">{item.accuracy}%</span>
                        <span className="text-sm text-gray-500 mb-1">accuracy</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                            className={`h-2.5 rounded-full ${
                                item.accuracy >= 70 ? 'bg-green-500' : item.accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.accuracy}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-500">{item.correct} / {item.total} correct</p>
                </div>
            ))}
        </div>
    </div>
  );
};

export default StatsView;
