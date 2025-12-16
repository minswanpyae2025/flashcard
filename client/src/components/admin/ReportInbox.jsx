import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import API_URL from '../../config';

const ReportInbox = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editContent, setEditContent] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    axios.get(`${API_URL}/api/admin/reports?status=open`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setReports(res.data))
    .catch(err => console.error(err));
  };

  const handleSelectReport = (report) => {
      setSelectedReport(report);
      // Clone content for editing
      if (report.content) {
          setEditContent({ ...report.content });
      } else {
          setEditContent(null);
      }
  };

  const handleSaveAndResolve = () => {
      if (!editContent || !selectedReport) return;

      const url = selectedReport.targetType === 'flashcard'
        ? `${API_URL}/flashcards/${selectedReport.targetId}`
        : `${API_URL}/quiz/questions/${selectedReport.targetId}`;

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Update Content
      axios.put(url, editContent, { headers })
        .then(() => {
            // 2. Resolve Report
            return axios.put(`${API_URL}/api/admin/reports/${selectedReport.id}/resolve`, {}, { headers });
        })
        .then(() => {
            alert('Content updated and report resolved.');
            setSelectedReport(null);
            fetchReports();
        })
        .catch(err => alert(err.message));
  };

  const handleResolveOnly = () => {
      axios.put(`${API_URL}/api/admin/reports/${selectedReport.id}/resolve`, {}, {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
          setSelectedReport(null);
          fetchReports();
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="h-full flex flex-col">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Report Inbox</h2>

        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* List */}
            <div className="w-1/3 bg-white rounded shadow overflow-y-auto">
                {reports.length === 0 && <div className="p-4 text-gray-500">No open reports.</div>}
                {reports.map(r => (
                    <div
                        key={r.id}
                        onClick={() => handleSelectReport(r)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedReport?.id === r.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                    >
                        <div className="font-bold text-gray-800">{r.reason}</div>
                        <div className="text-sm text-gray-500 truncate">{r.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()} • {r.targetType}</div>
                    </div>
                ))}
            </div>

            {/* Detail & Edit */}
            <div className="flex-1 bg-white rounded shadow p-6 overflow-y-auto">
                {selectedReport ? (
                    <div>
                        <div className="mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold mb-2">User Report</h3>
                            <p><strong>Reason:</strong> {selectedReport.reason}</p>
                            <p><strong>Description:</strong> {selectedReport.description}</p>
                            <p className="text-sm text-gray-500 mt-2">Reported by User #{selectedReport.user_id}</p>
                        </div>

                        {editContent ? (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-indigo-700">Edit Content & Resolve</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Question</label>
                                        <textarea
                                            value={editContent.question}
                                            onChange={e => setEditContent({...editContent, question: e.target.value})}
                                            className="mt-1 block w-full border border-gray-300 rounded p-2"
                                            rows="3"
                                        />
                                    </div>

                                    {selectedReport.targetType === 'flashcard' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Answer</label>
                                            <textarea
                                                value={editContent.answer}
                                                onChange={e => setEditContent({...editContent, answer: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                rows="3"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Explanation</label>
                                                <textarea
                                                    value={editContent.explanation}
                                                    onChange={e => setEditContent({...editContent, explanation: e.target.value})}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                    rows="3"
                                                />
                                            </div>
                                            {/* Options editing could be added here if needed */}
                                        </>
                                    )}

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={handleSaveAndResolve}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Save Fix & Resolve
                                        </button>
                                        <button
                                            onClick={handleResolveOnly}
                                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Mark Resolved (No Changes)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-red-500">Target content not found (deleted?). <button onClick={handleResolveOnly} className="underline">Mark Resolved</button></div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center mt-20">Select a report to view details.</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ReportInbox;
