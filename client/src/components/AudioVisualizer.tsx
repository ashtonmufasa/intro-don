interface AudioVisualizerProps {
  isPlaying: boolean;
}

export default function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const bars = 10;

  return (
    <div className="flex items-end justify-center gap-1.5 h-24 my-6">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-3 rounded-full transition-all duration-200 ${
            isPlaying ? 'visualizer-bar' : ''
          }`}
          style={{
            height: isPlaying ? undefined : '8px',
            background: `linear-gradient(to top, #ff2d78, #00f0ff)`,
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${0.3 + Math.random() * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
