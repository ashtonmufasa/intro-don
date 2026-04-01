import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerInfo, QuestionResult } from '../App';

interface ResultScreenProps {
  nickname: string;
  players: PlayerInfo[];
  results: QuestionResult[];
  winner: string | null;
  isDraw: boolean;
  onPlayAgain: () => void;
  onGoToTop: () => void;
}

export default function ResultScreen({
  nickname, players, results, winner, isDraw, onPlayAgain, onGoToTop,
}: ResultScreenProps) {
  const isWinner = winner === nickname;

  useEffect(() => {
    if (isWinner) {
      // Big confetti for winner
      const end = Date.now() + 2000;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff2d78', '#00f0ff', '#ffd700'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff2d78', '#00f0ff', '#ffd700'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isWinner]);

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8">
      {/* Title */}
      <h2 className="text-3xl font-zen font-black neon-text mb-8">結果発表！</h2>

      {/* Winner/Draw announcement */}
      <div className="mb-8 text-center">
        {isDraw ? (
          <>
            <div className="text-6xl mb-3">&#129309;</div>
            <p className="text-3xl font-bold text-neon-yellow">引き分け！</p>
          </>
        ) : isWinner ? (
          <>
            <div className="text-6xl mb-3">&#127942;</div>
            <p className="text-3xl font-bold text-neon-yellow">あなたの勝ち！</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-3">&#128557;</div>
            <p className="text-3xl font-bold text-gray-400">残念...</p>
            <p className="text-neon-cyan text-lg mt-1">{winner} の勝ち！</p>
          </>
        )}
      </div>

      {/* Final Scores */}
      <div className="w-full max-w-md mb-8">
        {sorted.map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-4 rounded-2xl mb-3 ${
              i === 0 && !isDraw
                ? 'bg-gradient-to-r from-neon-yellow/20 to-transparent border border-neon-yellow/30'
                : 'bg-dark-surface border border-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-orbitron text-2xl font-bold text-gray-500 w-8">
                {i + 1}
              </span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                i === 0 ? 'bg-neon-yellow/30 text-neon-yellow' : 'bg-gray-600/30 text-gray-400'
              }`}>
                {p.nickname.charAt(0)}
              </div>
              <span className="font-bold text-lg">{p.nickname}</span>
              {p.nickname === nickname && (
                <span className="text-xs bg-neon-pink/20 text-neon-pink px-2 py-0.5 rounded-full">あなた</span>
              )}
            </div>
            <span className="font-orbitron text-3xl font-bold text-neon-cyan">{p.score}</span>
          </div>
        ))}
      </div>

      {/* Question History */}
      <div className="w-full max-w-md mb-8">
        <h3 className="text-sm text-gray-400 mb-3">回答履歴</h3>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-dark-surface rounded-xl p-3 border border-gray-700/30"
            >
              <span className="font-orbitron text-sm text-gray-500 w-6">
                {i + 1}
              </span>
              {r.albumImageUrl && (
                <img src={r.albumImageUrl} alt="" className="w-10 h-10 rounded-lg" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{r.trackName}</p>
                <p className="text-xs text-gray-400 truncate">{r.artistName}</p>
              </div>
              <div className="text-right shrink-0">
                {r.buzzWinner ? (
                  <div>
                    <span className={`text-xs ${r.isCorrect ? 'text-neon-green' : 'text-red-400'}`}>
                      {r.isCorrect ? '○' : '✕'} {r.buzzWinner}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">スルー</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3 pb-8">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-gradient-to-r from-neon-pink to-purple-600 rounded-xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-neon-pink/30 active:scale-95"
        >
          もう一度遊ぶ
        </button>
        <button
          onClick={onGoToTop}
          className="w-full py-3 text-gray-400 hover:text-white transition-colors"
        >
          トップに戻る
        </button>
      </div>
    </div>
  );
}
