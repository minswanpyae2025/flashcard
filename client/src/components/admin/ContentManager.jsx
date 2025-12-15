import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';

const ContentManager = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('flashcards');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchItems();
    fetchTaxonomy();
  }, [activeTab]);

  const fetchItems = () => {
    const url = activeTab === 'flashcards'
      ? 'http://localhost:3000/flashcards'
      : 'http://localhost:3000/quiz/questions?limit=100';

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  const fetchTaxonomy = () => {
      const headers = { Authorization: `Bearer ${token}` };
      axios.get('http://localhost:3000/api/admin/categories', { headers }).then(res => setCategories(res.data));
      axios.get('http://localhost:3000/api/admin/tags', { headers }).then(res => setTags(res.data));
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure?')) return;
    const url = activeTab === 'flashcards'
      ? `http://localhost:3000/flashcards/${id}`
      : `http://localhost:3000/quiz/questions/${id}`;

    axios.delete(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchItems())
      .catch(err => alert(err.message));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Prepare form data.
    // Tags are usually objects in the item, map to IDs for the form
    const itemTags = item.Tags ? item.Tags.map(t => t.id) : [];
    setFormData({ ...item, tags: itemTags });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData(activeTab === 'flashcards' ? {
        question: '', answer: '', module: '', year: '', CategoryId: '', tags: []
    } : {
        question: '', options: ['', '', '', ''], correct_option: 0, explanation: '', type: 'practice', module: '', year: '', CategoryId: '', tags: []
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = activeTab === 'flashcards'
      ? 'http://localhost:3000/flashcards'
      : 'http://localhost:3000/quiz/questions';

    const method = editingItem ? 'put' : 'post';
    const finalUrl = editingItem ? `${url}/${editingItem.id}` : url;

    axios[method](finalUrl, formData, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
          setShowForm(false);
          fetchItems();
      })
      .catch(err => alert(err.response?.data?.error || err.message));
  };

  const toggleTag = (tagId) => {
      const currentTags = formData.tags || [];
      if (currentTags.includes(tagId)) {
          setFormData({ ...formData, tags: currentTags.filter(id => id !== tagId) });
      } else {
          setFormData({ ...formData, tags: [...currentTags, tagId] });
      }
  };

  const filteredCategories = categories.filter(c => c.type === (activeTab === 'flashcards' ? 'flashcard' : 'question'));

  return (
    <div>
       <h2 className="text-3xl font-bold mb-8 text-gray-800">Content Manager</h2>

       <div className="flex border-b mb-6">
            <button
                onClick={() => { setActiveTab('flashcards'); setShowForm(false); }}
                className={`px-6 py-3 font-bold ${activeTab === 'flashcards' ? 'bg-white border-t border-r border-l text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}
            >
                Flashcards
            </button>
            <button
                onClick={() => { setActiveTab('questions'); setShowForm(false); }}
                className={`px-6 py-3 font-bold ${activeTab === 'questions' ? 'bg-white border-t border-r border-l text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}
            >
                Questions Bank
            </button>
        </div>

        {!showForm ? (
            <>
                <button
                    onClick={handleAddNew}
                    className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                    + Add New {activeTab === 'flashcards' ? 'Flashcard' : 'Question'}
                </button>

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{item.question}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.Category?.name || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.Tags?.map(t => t.name).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        ) : (
            <div className="bg-white p-6 rounded shadow max-w-2xl">
                <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Create'} {activeTab === 'flashcards' ? 'Flashcard' : 'Question'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            value={formData.CategoryId || ''}
                            onChange={e => setFormData({ ...formData, CategoryId: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="">Select Category</option>
                            {filteredCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {tags.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleTag(t.id)}
                                    className={`px-3 py-1 rounded-full text-xs border ${
                                        (formData.tags || []).includes(t.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question</label>
                        <textarea
                            value={formData.question}
                            onChange={e => setFormData({...formData, question: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            rows="3"
                            required
                        />
                    </div>

                    {activeTab === 'flashcards' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Answer</label>
                            <textarea
                                value={formData.answer}
                                onChange={e => setFormData({...formData, answer: e.target.value})}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                rows="3"
                                required
                            />
                        </div>
                    ) : (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                {formData.options.map((opt, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...formData.options];
                                            newOpts[i] = e.target.value;
                                            setFormData({...formData, options: newOpts});
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65+i)}`}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
                                        required
                                    />
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Correct Option (Index 0-3)</label>
                                <select
                                    value={formData.correct_option}
                                    onChange={e => setFormData({...formData, correct_option: parseInt(e.target.value)})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    {[0,1,2,3].map(i => <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Explanation</label>
                                <textarea
                                    value={formData.explanation}
                                    onChange={e => setFormData({...formData, explanation: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};

export default ContentManager;
