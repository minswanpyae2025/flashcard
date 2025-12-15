import React, { useState, useEffect } from 'react';

const Watermark = ({ user }) => {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Initialize positions
    const generatePositions = () => {
      const newPositions = [];
      for (let i = 0; i < 5; i++) {
        newPositions.push({
          top: Math.random() * 90 + '%',
          left: Math.random() * 90 + '%',
          rotation: Math.random() * 90 - 45, // -45 to 45 degrees
        });
      }
      setPositions(newPositions);
    };

    generatePositions();

    const interval = setInterval(generatePositions, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <div id="secure-watermark" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute text-gray-400 opacity-20 text-sm whitespace-nowrap transition-all duration-1000 ease-in-out"
          style={{
            top: pos.top,
            left: pos.left,
            transform: `rotate(${pos.rotation}deg)`,
          }}
        >
          {user.name} | {user.email} | {new Date().toLocaleDateString()}
        </div>
      ))}
    </div>
  );
};

export default Watermark;
