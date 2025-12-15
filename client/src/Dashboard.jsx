import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { useAntiLeak, useBlurOnInactive, useWatermarkProtection } from './hooks/useSecurity';
import Watermark from './components/Watermark';
import QuizCard from './components/QuizCard';
import QuizView from './components/QuizView';
import StatsView from './components/StatsView';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [view, setView] = useState('flashcards'); // flashcards, quiz, stats
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Enable Security Features
  useAntiLeak();
  useBlurOnInactive();
  useWatermarkProtection('secure-watermark');

  useEffect(() => {
    if (token && view === 'flashcards') {
      fetchDueCards();
    }
  }, [token, view]);

  const fetchDueCards = () => {
    setLoading(true);
    axios.get('http://localhost:3000/reviews/due', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setDueCards(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleReview = (cardId, rating) => {
    axios.post('http://localhost:3000/reviews', { cardId, rating }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
        // Move to next card
        if (currentCardIndex < dueCards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            // Finished current batch, maybe fetch more or show done screen
            setDueCards([]);
            // alert("All caught up for now!");
        }
    })
    .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">
      <Watermark user={user} />

      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            {user?.role === 'admin' && (
                <a href="/admin" className="text-blue-600 hover:underline text-sm">Go to Admin Dashboard</a>
            )}
        </div>
        <div className="space-x-4">
             <button
                onClick={() => setView('flashcards')}
                className={`px-4 py-2 rounded ${view === 'flashcards' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
                Flashcards
            </button>
            <button
                onClick={() => setView('quiz')}
                className={`px-4 py-2 rounded ${view === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
                Quizzes / Exams
            </button>
            <button
                onClick={() => setView('stats')}
                className={`px-4 py-2 rounded ${view === 'stats' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
                Stats
            </button>
        </div>
      </div>

      {view === 'stats' ? (
          <StatsView onBack={() => setView('flashcards')} />
      ) : view === 'quiz' ? (
          <QuizView onBack={() => setView('flashcards')} />
      ) : (
          <>
            {loading ? (
                <div className="text-center py-20">Loading...</div>
            ) : dueCards.length > 0 && currentCardIndex < dueCards.length ? (
                <div>
                     <div className="text-center text-gray-600 mb-4">Cards Due: {dueCards.length - currentCardIndex}</div>
                     <QuizCard
                        card={dueCards[currentCardIndex]}
                        onReview={handleReview}
                    />
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">You're all caught up!</h2>
                    <p className="text-gray-600">Great job. Check back later for more reviews.</p>
                    <button
                        onClick={fetchDueCards}
                        className="mt-4 text-blue-500 hover:text-blue-700 underline"
                    >
                        Refresh
                    </button>
                </div>
            )}
          </>
      )}
    </div>
  );
};

export default Dashboard;
