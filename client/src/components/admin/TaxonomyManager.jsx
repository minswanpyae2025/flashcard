import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';

const TaxonomyManager = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('question');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get('http://localhost:3000/api/admin/categories', { headers }).then(res => setCategories(res.data));
    axios.get('http://localhost:3000/api/admin/tags', { headers }).then(res => setTags(res.data));
  };

  const addCategory = () => {
      axios.post('http://localhost:3000/api/admin/categories', { name: newCatName, type: newCatType }, {
          headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
          setNewCatName('');
          fetchData();
      });
  };

  const deleteCategory = (id) => {
      if(!confirm('Delete category?')) return;
      axios.delete(`http://localhost:3000/api/admin/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
      }).then(fetchData);
  };

  const addTag = () => {
      axios.post('http://localhost:3000/api/admin/tags', { name: newTagName }, {
          headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
          setNewTagName('');
          fetchData();
      });
  };

  const deleteTag = (id) => {
      if(!confirm('Delete tag?')) return;
      axios.delete(`http://localhost:3000/api/admin/tags/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
      }).then(fetchData);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Taxonomy Manager</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories */}
        <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Categories</h3>
            <div className="flex space-x-2 mb-4">
                <input
                    className="border p-2 rounded flex-1"
                    placeholder="Category Name"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                />
                <select
                    className="border p-2 rounded"
                    value={newCatType}
                    onChange={e => setNewCatType(e.target.value)}
                >
                    <option value="question">Question</option>
                    <option value="flashcard">Flashcard</option>
                </select>
                <button onClick={addCategory} className="bg-blue-500 text-white px-4 rounded">Add</button>
            </div>
            <ul>
                {categories.map(c => (
                    <li key={c.id} className="flex justify-between items-center border-b py-2">
                        <span>{c.name} <span className="text-xs text-gray-400">({c.type})</span></span>
                        <button onClick={() => deleteCategory(c.id)} className="text-red-500 text-sm">Delete</button>
                    </li>
                ))}
            </ul>
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Tags</h3>
            <div className="flex space-x-2 mb-4">
                <input
                    className="border p-2 rounded flex-1"
                    placeholder="Tag Name"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                />
                <button onClick={addTag} className="bg-blue-500 text-white px-4 rounded">Add</button>
            </div>
             <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                    <span key={t.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                        {t.name}
                        <button onClick={() => deleteTag(t.id)} className="ml-2 text-red-500 font-bold">&times;</button>
                    </span>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaxonomyManager;
