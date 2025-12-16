import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import API_URL from '../../config';

const UserAccessManager = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers }),
        axios.get(`${API_URL}/api/admin/categories`, { headers })
    ]).then(([usersRes, catsRes]) => {
        setUsers(usersRes.data);
        setCategories(catsRes.data);
        setLoading(false);
    }).catch(err => console.error(err));
  }, [token]);

  const toggleCategory = (user, catId) => {
      const currentCats = user.Categories.map(c => c.id);
      let newCats;
      if (currentCats.includes(catId)) {
          newCats = currentCats.filter(id => id !== catId);
      } else {
          newCats = [...currentCats, catId];
      }

      // Update UI optimistically
      const updatedUsers = users.map(u => {
          if (u.id === user.id) {
              return { ...u, Categories: newCats.map(id => categories.find(c => c.id === id)) };
          }
          return u;
      });
      setUsers(updatedUsers);

      // Save to backend
      axios.post(`${API_URL}/api/admin/users/${user.id}/access`, { categoryIds: newCats }, {
          headers: { Authorization: `Bearer ${token}` }
      }).catch(err => alert('Failed to save access'));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">User Access Control</h2>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                    <tr key={user.id}>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {user.role === 'admin' ? (
                                <span className="text-gray-400 text-sm">Admins have full access</span>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => {
                                        const hasAccess = user.Categories.some(c => c.id === cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleCategory(user, cat.id)}
                                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                                    hasAccess
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAccessManager;
