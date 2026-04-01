import { PlayerInfo } from '../App';

interface ScoreBoardProps {
  players: PlayerInfo[];
  questionNumber: number;
  totalQuestions: number;
}

export default function ScoreBoard({ players, questionNumber, totalQuestions }: ScoreBoardProps) {
  const p1 = players[0];
  const p2 = players[1];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question progress */}
      <div className="text-center mb-3">
        <span className="text-sm text-gray-400">Question</span>
        <span className="font-orbitron text-neon-yellow ml-2 text-lg">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between bg-dark-surface rounded-2xl p-4 border border-gray-700/50">
        {/* Player 1 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-pink/30 flex items-center justify-center text-neon-pink font-bold">
            {p1?.nickname.charAt(0) || '?'}
          </div>
          <div>
            <div className="text-sm font-bold">{p1?.nickname || 'Player 1'}</div>
            <div className="font-orbitron text-2xl text-neon-pink">{p1?.score ?? 0}</div>
          </div>
        </div>

        {/* VS */}
        <div className="text-gray-500 font-orbitron text-xl">VS</div>

        {/* Player 2 */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-sm font-bold">{p2?.nickname || 'Player 2'}</div>
            <div className="font-orbitron text-2xl text-neon-cyan">{p2?.score ?? 0}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-neon-cyan/30 flex items-center justify-center text-neon-cyan font-bold">
            {p2?.nickname.charAt(0) || '?'}
          </div>
        </div>
      </div>
    </div>
  );
}
