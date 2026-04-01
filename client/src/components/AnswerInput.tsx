import { useState, useEffect, useRef } from 'react';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  timeLimit: number; // seconds
}

export default function AnswerInput({ onSubmit, timeLimit }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const [remaining, setRemaining] = useState(timeLimit);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (submittedRef.current) return;
    if (answer.trim().length === 0) return;
    submittedRef.current = true;
    onSubmit(answer.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const urgency = remaining <= 3;

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      {/* Timer */}
      <div className="text-center mb-4">
        <span className={`font-orbitron text-4xl font-bold ${urgency ? 'text-red-500 animate-pulse' : 'text-neon-yellow'}`}>
          {remaining}
        </span>
        <span className="text-gray-400 text-sm ml-1">秒</span>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="曲名を入力..."
          className="flex-1 bg-dark-card border-2 border-neon-pink rounded-xl px-4 py-3 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-pink transition-all"
          autoComplete="off"
        />
        <button
          onClick={handleSubmit}
          disabled={answer.trim().length === 0}
          className="px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-600 rounded-xl text-white font-bold transition-all hover:shadow-lg active:scale-95 disabled:opacity-40"
        >
          回答！
        </button>
      </div>
    </div>
  );
}
