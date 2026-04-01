import { useState, useRef } from 'react';

interface BuzzerButtonProps {
  onPress: () => void;
  disabled: boolean;
}

export default function BuzzerButton({ onPress, disabled }: BuzzerButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;

    // Create ripple effect
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onPress();
  };

  return (
    <div className="flex items-center justify-center my-8">
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={disabled}
        className={`relative w-52 h-52 rounded-full font-zen font-black text-2xl transition-all overflow-hidden
          ${disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-br from-neon-pink to-red-600 text-white animate-pulse-glow hover:scale-105 active:scale-95 cursor-pointer'
          }`}
        style={{
          boxShadow: disabled ? 'none' : '0 0 30px rgba(255, 45, 120, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Ripple effects */}
        {ripples.map(r => (
          <span
            key={r.id}
            className="ripple"
            style={{ left: r.x, top: r.y, width: 20, height: 20, marginLeft: -10, marginTop: -10 }}
          />
        ))}

        {/* Button text */}
        <span className="relative z-10 select-none">
          {disabled ? '待機中...' : '早押し！'}
        </span>
      </button>
    </div>
  );
}
