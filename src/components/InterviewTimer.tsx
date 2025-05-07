import React from 'react';
import { Timer } from 'lucide-react';

interface InterviewTimerProps {
  timeRemaining: number;
}

const InterviewTimer: React.FC<InterviewTimerProps> = ({ timeRemaining }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50">
      <Timer className={`w-4 h-4 ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'}`} />
      <span className={`font-medium ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

export default InterviewTimer;