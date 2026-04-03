import { useState, useEffect, useRef } from 'react';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  onPass: () => void;
}

export default function AnswerInput({ onSubmit, onPass }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
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

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      {/* Input */}
      <div className="flex gap-2 mb-3">
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

      <button
        onClick={onPass}
        className="px-6 py-2 bg-gray-700 rounded-xl text-gray-300 text-sm transition-all hover:bg-gray-600 active:scale-95"
      >
        パス（回答権を放棄）
      </button>
    </div>
  );
}
