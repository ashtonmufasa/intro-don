import { useEffect, useState } from 'react';

interface CountDownProps {
  number: number;
}

export default function CountDown({ number }: CountDownProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [number]);

  return (
    <div className="flex items-center justify-center h-48">
      <div
        key={key}
        className="countdown-number font-orbitron text-9xl font-black"
        style={{
          color: number === 1 ? '#ff2d78' : number === 2 ? '#ffd700' : '#00f0ff',
          textShadow: `0 0 30px currentColor, 0 0 60px currentColor`,
        }}
      >
        {number}
      </div>
    </div>
  );
}
