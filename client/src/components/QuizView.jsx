import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const QuizView = ({ onBack }) => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = (type = 'practice') => {
    setLoading(true);
    axios.get(`http://localhost:3000/quiz/questions?type=${type}`, {
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

  const handleOptionSelect = (index) => {
    if (feedback) return; // Prevent changing after submission
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const question = questions[currentQuestionIndex];
    axios.post('http://localhost:3000/quiz/submit', {
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
    setCurrentQuestionIndex(prev => prev + 1);
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

  const prevQuestion = () => {
      if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
          setSelectedOption(null);
          setFeedback(null);
      }
  };

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
            <span>Score: {score}</span>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6">{question.question}</h2>

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
