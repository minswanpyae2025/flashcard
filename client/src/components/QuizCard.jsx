import React, { useState } from 'react';

const QuizCard = ({ card, onReview }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleReview = (rating) => {
    onReview(card.id, rating);
    setShowAnswer(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 mt-10 relative z-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Question</h2>
        <div className="text-lg text-gray-700">{card.question}</div>
      </div>

      {showAnswer ? (
        <div className="animate-fade-in">
          <div className="mb-8 border-t pt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Answer</h2>
            <div className="text-lg text-gray-700">{card.answer}</div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            <button
              onClick={() => handleReview('again')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Again
              <div className="text-xs font-normal opacity-75">&lt; 10m</div>
            </button>
            <button
              onClick={() => handleReview('hard')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
            >
              Hard
              <div className="text-xs font-normal opacity-75">1-2d</div>
            </button>
            <button
              onClick={() => handleReview('good')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Good
              <div className="text-xs font-normal opacity-75">3-5d</div>
            </button>
            <button
              onClick={() => handleReview('easy')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Easy
              <div className="text-xs font-normal opacity-75">7d+</div>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded transition duration-150"
        >
          Show Answer
        </button>
      )}
    </div>
  );
};

export default QuizCard;
