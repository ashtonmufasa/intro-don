import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PlayerInfo, QuestionResult, GameSettings } from '../App';
import ScoreBoard from './ScoreBoard';
import AudioVisualizer from './AudioVisualizer';
import CountDown from './CountDown';
import BuzzerButton from './BuzzerButton';
import AnswerInput from './AnswerInput';

interface GamePlayProps {
  nickname: string;
  players: PlayerInfo[];
  gamePhase: 'loading' | 'countdown' | 'playing' | 'buzzer-won' | 'answering' | 'result' | 'time-up';
  questionNumber: number;
  totalQuestions: number;
  countdownNum: number;
  buzzerWinner: string | null;
  isMyBuzzer: boolean;
  lastResult: QuestionResult | null;
  isPlaying: boolean;
  settings: GameSettings;
  onPressBuzzer: () => void;
  onSubmitAnswer: (answer: string) => void;
}

export default function GamePlay({
  nickname, players, gamePhase, questionNumber, totalQuestions,
  countdownNum, buzzerWinner, isMyBuzzer, lastResult, isPlaying,
  settings, onPressBuzzer, onSubmitAnswer,
}: GamePlayProps) {
  const shakeRef = useRef<HTMLDivElement>(null);
  const confettiFired = useRef(false);

  // Fire confetti on correct answer
  useEffect(() => {
    if (gamePhase === 'result' && lastResult?.isCorrect && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff2d78', '#00f0ff', '#ffd700', '#39ff14'],
      });
    }
    if (gamePhase === 'countdown') {
      confettiFired.current = false;
    }
  }, [gamePhase, lastResult]);

  // Shake on wrong answer
  useEffect(() => {
    if ((gamePhase === 'result' && lastResult && !lastResult.isCorrect) || gamePhase === 'time-up') {
      shakeRef.current?.classList.add('shake');
      setTimeout(() => shakeRef.current?.classList.remove('shake'), 500);
    }
  }, [gamePhase, lastResult]);

  return (
    <div ref={shakeRef} className="min-h-screen flex flex-col items-center p-4 pt-6">
      {/* Score Board */}
      {gamePhase !== 'loading' && (
        <ScoreBoard
          players={players}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">

        {/* Loading */}
        {gamePhase === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">楽曲を読み込み中...</p>
          </div>
        )}

        {/* Countdown */}
        {gamePhase === 'countdown' && (
          <CountDown number={countdownNum} />
        )}

        {/* Playing - Buzzer active */}
        {gamePhase === 'playing' && (
          <div className="text-center w-full">
            <p className="text-neon-cyan text-lg mb-2 neon-cyan">&#127911; イントロ再生中...</p>
            <AudioVisualizer isPlaying={isPlaying} />
            <BuzzerButton onPress={onPressBuzzer} disabled={false} />
          </div>
        )}

        {/* Buzzer won by other player */}
        {gamePhase === 'buzzer-won' && (
          <div className="text-center animate-slide-up">
            <div className="text-6xl mb-4">&#128276;</div>
            <p className="text-2xl font-bold text-neon-yellow mb-2">
              {buzzerWinner} が早押し！
            </p>
            <p className="text-gray-400">回答を待っています...</p>
          </div>
        )}

        {/* Answering (my turn) */}
        {gamePhase === 'answering' && (
          <div className="text-center w-full">
            <div className="text-4xl mb-3">&#128276;</div>
            <p className="text-xl font-bold text-neon-pink mb-4">あなたの回答！</p>
            <AnswerInput onSubmit={onSubmitAnswer} timeLimit={10} />
          </div>
        )}

        {/* Result */}
        {(gamePhase === 'result' || gamePhase === 'time-up') && lastResult && (
          <div className="text-center animate-slide-up w-full">
            {/* Correct/Incorrect badge */}
            {gamePhase === 'time-up' ? (
              <div className="text-6xl mb-3">&#9200;</div>
            ) : lastResult.isCorrect ? (
              <div className="text-6xl mb-3">&#127881;</div>
            ) : (
              <div className="text-6xl mb-3">&#10060;</div>
            )}

            <p className={`text-2xl font-bold mb-4 ${
              gamePhase === 'time-up' ? 'text-gray-400' :
              lastResult.isCorrect ? 'text-neon-green' : 'text-red-400'
            }`}>
              {gamePhase === 'time-up' ? 'タイムアップ！' :
               lastResult.isCorrect ? '正解！' : '不正解...'}
            </p>

            {/* Show the answer */}
            {lastResult.buzzWinner && lastResult.answer && (
              <p className="text-gray-400 mb-2 text-sm">
                {lastResult.buzzWinner} の回答: 「{lastResult.answer}」
              </p>
            )}

            {/* Correct answer card */}
            <div className="bg-dark-surface rounded-2xl p-5 border border-gray-700/50 inline-block">
              {lastResult.albumImageUrl && (
                <img
                  src={lastResult.albumImageUrl}
                  alt=""
                  className="w-28 h-28 rounded-xl mx-auto mb-3 shadow-lg"
                />
              )}
              <p className="text-neon-yellow font-bold text-lg">{lastResult.trackName}</p>
              <p className="text-gray-400 text-sm">{lastResult.artistName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
