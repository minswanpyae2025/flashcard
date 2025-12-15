import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const AdminDashboard = ({ onBack }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('flashcards');
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = () => {
    const url = activeTab === 'flashcards'
      ? 'http://localhost:3000/flashcards'
      : 'http://localhost:3000/quiz/questions?limit=100'; // Fetch more for admin

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
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
    setFormData(item);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData(activeTab === 'flashcards' ? {
        question: '', answer: '', module: '', year: '', tags: ''
    } : {
        question: '', options: ['', '', '', ''], correct_option: 0, explanation: '', type: 'practice', module: '', year: ''
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

    // Process form data for quiz options
    let data = { ...formData };
    if (activeTab === 'questions' && typeof data.options === 'string') {
        // Just in case, but we bind to array indices below
    }

    axios[method](finalUrl, data, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
          setShowForm(false);
          fetchItems();
      })
      .catch(err => alert(err.response?.data?.error || err.message));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={onBack} className="text-blue-500 hover:underline">Back to Student View</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
            <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-6 py-3 font-bold ${activeTab === 'flashcards' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                Flashcards
            </button>
            <button
                onClick={() => setActiveTab('questions')}
                className={`px-6 py-3 font-bold ${activeTab === 'questions' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                Questions Bank
            </button>
        </div>

        <div className="p-6">
            {!showForm ? (
                <>
                    <button
                        onClick={handleAddNew}
                        className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                        + Add New {activeTab === 'flashcards' ? 'Flashcard' : 'Question'}
                    </button>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{item.question}</td>
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
                <div className="max-w-2xl">
                    <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} {activeTab === 'flashcards' ? 'Flashcard' : 'Question'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option value="practice">Practice Quiz</option>
                                        <option value="exam">Past Exam</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Module</label>
                                <input
                                    type="text"
                                    value={formData.module || ''}
                                    onChange={e => setFormData({...formData, module: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    value={formData.year || ''}
                                    onChange={e => setFormData({...formData, year: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </div>

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
      </div>
    </div>
  );
};

export default AdminDashboard;
