import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import CanvasText from './CanvasText';
import API_URL from '../config';

const QuizView = ({ onBack }) => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Typo');
  const [reportDetails, setReportDetails] = useState('');

  const startQuiz = (type = 'practice') => {
    setLoading(true);
    axios.get(`${API_URL}/quiz/questions?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setQuestions(res.data);
        setQuizStarted(true);
        setLoading(false);
        setCurrentQuestionIndex(0);
        setScore(0);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  };

  const submitReport = () => {
      const question = questions[currentQuestionIndex];
      axios.post(`${API_URL}/quiz/report`, {
          questionId: question.id,
          reason: reportReason,
          details: reportDetails
      }, {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
          setShowReportModal(false);
          alert('Report submitted. Thank you!');
          setReportReason('Typo');
          setReportDetails('');
      })
      .catch(err => alert('Error submitting report'));
  };

  const handleOptionSelect = (index) => {
    if (feedback) return; // Prevent changing after submission
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const question = questions[currentQuestionIndex];
    axios.post(`${API_URL}/quiz/submit`, {
        questionId: question.id,
        selectedOption
    }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setFeedback(res.data);
        if (res.data.isCorrect) setScore(s => s + 1);
    })
    .catch(err => console.error(err));
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setFeedback(null);
    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);
  };

  const prevQuestion = () => {
      if (currentQuestionIndex > 0) {
          const prevIdx = currentQuestionIndex - 1;
          setCurrentQuestionIndex(prevIdx);
          setSelectedOption(null);
          setFeedback(null);
      }
  };

  if (!quizStarted) {
      return (
          <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-6">Select Mode</h2>
              <div className="space-x-4">
                  <button
                    onClick={() => startQuiz('practice')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded"
                  >
                      Practice Quiz
                  </button>
                  <button
                    onClick={() => startQuiz('exam')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded"
                  >
                      Past Exam Mode
                  </button>
              </div>
              <button onClick={onBack} className="mt-8 text-gray-600 underline">Back to Dashboard</button>
          </div>
      );
  }

  if (loading) return <div>Loading questions...</div>;

  if (currentQuestionIndex >= questions.length) {
      return (
          <div className="text-center py-10 bg-white rounded shadow p-8">
              <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
              <p className="text-xl">Score: {score} / {questions.length}</p>
              <button
                onClick={() => setQuizStarted(false)}
                className="mt-6 bg-gray-500 text-white py-2 px-4 rounded"
              >
                  Back to Menu
              </button>
          </div>
      );
  }

  const question = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 mt-6 relative z-10">
        <div className="flex justify-between mb-4 text-sm text-gray-500">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <div className="flex items-center space-x-4">
                <span>Score: {score}</span>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold border border-red-500 rounded px-2 py-1"
                >
                    Flag
                </button>
            </div>
        </div>

        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Question</h2>
            <CanvasText text={question.question} className="text-lg text-gray-800" />
        </div>

        <div className="space-y-3">
            {question.options.map((opt, idx) => (
                <div
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`p-4 border rounded cursor-pointer transition-colors ${
                        selectedOption === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    } ${
                        feedback && idx === feedback.correctOption ? 'bg-green-100 border-green-500' : ''
                    } ${
                        feedback && !feedback.isCorrect && idx === selectedOption ? 'bg-red-100 border-red-500' : ''
                    }`}
                >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                </div>
            ))}
        </div>

        {feedback && (
            <div className="mt-6 p-4 bg-gray-100 rounded border border-gray-200">
                <h3 className="font-bold mb-2">{feedback.isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                <p>{feedback.explanation}</p>
            </div>
        )}

        {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg w-96">
                    <h3 className="text-lg font-bold mb-4">Report Question</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full border rounded p-2"
                        >
                            <option value="Typo">Typo</option>
                            <option value="Wrong Answer">Wrong Answer</option>
                            <option value="Confusing">Confusing</option>
                        </select>
                    </div>
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700">Details</label>
                         <textarea
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            className="w-full border rounded p-2"
                            rows="3"
                         />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="text-gray-600 hover:text-gray-800 px-3 py-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitReport}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="mt-8 flex space-x-4">
             <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className={`flex-1 py-3 px-6 rounded font-bold text-white ${
                    currentQuestionIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'
                }`}
            >
                Previous
            </button>
            {!feedback ? (
                <>
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className={`flex-1 py-3 px-6 rounded font-bold text-white ${
                        selectedOption !== null ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    Submit
                </button>
                <button
                    onClick={nextQuestion}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-bold"
                >
                    Skip
                </button>
                </>
            ) : (
                <button
                    onClick={nextQuestion}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-bold"
                >
                    Next
                </button>
            )}
        </div>
    </div>
  );
};

export default QuizView;
