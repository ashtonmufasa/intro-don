import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useAudio } from './hooks/useAudio';
import TopPage from './components/TopPage';
import WaitingRoom from './components/WaitingRoom';
import GamePlay from './components/GamePlay';
import ResultScreen from './components/ResultScreen';

export interface PlayerInfo {
  nickname: string;
  isHost: boolean;
  score: number;
}

export interface GameSettings {
  genres: string[];
  decades: string[];
  questionCount: number;
  timeLimit: number;
}

export interface QuestionResult {
  questionIndex: number;
  trackName: string;
  artistName: string;
  albumImageUrl: string;
  buzzWinner: string | null;
  answer: string | null;
  isCorrect: boolean;
  correctAnswer: string;
}

type Screen = 'top' | 'waiting' | 'game' | 'result';

function App() {
  const { connected, emit, on, off } = useSocket();
  const audio = useAudio();

  const [screen, setScreen] = useState<Screen>('top');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    genres: ['J-Pop'],
    decades: ['2020s'],
    questionCount: 10,
    timeLimit: 15,
  });
  const [error, setError] = useState('');

  // Game state
  const [gamePhase, setGamePhase] = useState<'loading' | 'countdown' | 'playing' | 'buzzer-won' | 'answering' | 'result' | 'time-up'>('loading');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [buzzerWinner, setBuzzerWinner] = useState<string | null>(null);
  const [isMyBuzzer, setIsMyBuzzer] = useState(false);
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Result state
  const [finalResults, setFinalResults] = useState<QuestionResult[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [disconnectMsg, setDisconnectMsg] = useState('');

  // Socket event handlers
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cleanups.push(on('room:player-joined', (data: { players: PlayerInfo[] }) => {
      setPlayers(data.players);
    }));

    cleanups.push(on('room:player-disconnected', (data: { nickname: string; players: PlayerInfo[] }) => {
      setPlayers(data.players);
      setDisconnectMsg(`${data.nickname} が切断しました`);
    }));

    cleanups.push(on('room:settings-updated', (data: { settings: GameSettings }) => {
      setSettings(data.settings);
    }));

    cleanups.push(on('room:host-changed', (data: { nickname: string }) => {
      if (data.nickname === nickname) {
        setIsHost(true);
      }
    }));

    cleanups.push(on('game:loading', () => {
      setGamePhase('loading');
      setScreen('game');
    }));

    cleanups.push(on('game:started', (data: { totalQuestions: number; players: PlayerInfo[] }) => {
      setTotalQuestions(data.totalQuestions);
      setPlayers(data.players);
      setScreen('game');
    }));

    cleanups.push(on('game:countdown', (data: { questionNumber: number; totalQuestions: number }) => {
      setGamePhase('countdown');
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setBuzzerWinner(null);
      setIsMyBuzzer(false);
      setLastResult(null);

      // Animate countdown: 3, 2, 1
      setCountdownNum(3);
      setTimeout(() => setCountdownNum(2), 1000);
      setTimeout(() => setCountdownNum(1), 2000);
    }));

    cleanups.push(on('game:play-intro', (data: { questionNumber: number; totalQuestions: number; previewUrl: string }) => {
      setGamePhase('playing');
      setQuestionNumber(data.questionNumber);
      setPreviewUrl(data.previewUrl);
      audio.play(data.previewUrl);
    }));

    cleanups.push(on('game:buzzer-result', (data: { winnerNickname: string; winnerId: string }) => {
      audio.stop();
      setBuzzerWinner(data.winnerNickname);
      const isMine = data.winnerNickname === nickname;
      setIsMyBuzzer(isMine);
      setGamePhase(isMine ? 'answering' : 'buzzer-won');
    }));

    cleanups.push(on('game:answer-result', (data: QuestionResult & { players: PlayerInfo[] }) => {
      setGamePhase('result');
      setLastResult(data);
      setPlayers(data.players);
    }));

    cleanups.push(on('game:time-up', (data: QuestionResult & { players: PlayerInfo[] }) => {
      audio.stop();
      setGamePhase('time-up');
      setLastResult(data);
      setPlayers(data.players);
    }));

    cleanups.push(on('game:finished', (data: { players: PlayerInfo[]; results: QuestionResult[]; winner: string | null; isDraw: boolean }) => {
      audio.stop();
      setPlayers(data.players);
      setFinalResults(data.results);
      setWinner(data.winner);
      setIsDraw(data.isDraw);
      setScreen('result');
    }));

    cleanups.push(on('game:reset', (data: { players: PlayerInfo[]; settings: GameSettings }) => {
      setPlayers(data.players);
      setSettings(data.settings);
      setScreen('waiting');
      setGamePhase('loading');
      setFinalResults([]);
    }));

    cleanups.push(on('game:paused', (data: { reason: string }) => {
      setDisconnectMsg(data.reason);
      setScreen('waiting');
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [on, nickname, audio]);

  // Create room
  const createRoom = useCallback((nick: string) => {
    setNickname(nick);
    setError('');
    emit('room:create', { nickname: nick }, (response: any) => {
      if (response.success) {
        setRoomId(response.roomId);
        setIsHost(true);
        setPlayers([{ nickname: nick, isHost: true, score: 0 }]);
        setScreen('waiting');
      } else {
        setError(response.error || 'ルームの作成に失敗しました');
      }
    });
  }, [emit]);

  // Join room
  const joinRoom = useCallback((nick: string, rId: string) => {
    setNickname(nick);
    setError('');
    emit('room:join', { nickname: nick, roomId: rId.toUpperCase() }, (response: any) => {
      if (response.success) {
        setRoomId(response.roomId);
        setIsHost(false);
        setPlayers(response.players);
        setSettings(response.settings);
        setScreen('waiting');
      } else {
        setError(response.error || 'ルームへの参加に失敗しました');
      }
    });
  }, [emit]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    emit('room:update-settings', { roomId, settings: newSettings });
  }, [emit, roomId, settings]);

  // Start game
  const startGame = useCallback(() => {
    setError('');
    emit('game:start', { roomId }, (response: any) => {
      if (!response.success) {
        setError(response.error || 'ゲームの開始に失敗しました');
      }
    });
  }, [emit, roomId]);

  // Press buzzer
  const pressBuzzer = useCallback(() => {
    emit('buzzer:press', { roomId, timestamp: Date.now() });
  }, [emit, roomId]);

  // Submit answer
  const submitAnswer = useCallback((answer: string) => {
    emit('answer:submit', { roomId, answer });
  }, [emit, roomId]);

  // Play again
  const playAgain = useCallback(() => {
    emit('game:play-again', { roomId });
  }, [emit, roomId]);

  // Go to top
  const goToTop = useCallback(() => {
    setScreen('top');
    setRoomId('');
    setPlayers([]);
    setFinalResults([]);
    setDisconnectMsg('');
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      {screen === 'top' && (
        <TopPage
          connected={connected}
          error={error}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}
      {screen === 'waiting' && (
        <WaitingRoom
          roomId={roomId}
          isHost={isHost}
          players={players}
          settings={settings}
          disconnectMsg={disconnectMsg}
          error={error}
          onUpdateSettings={updateSettings}
          onStartGame={startGame}
          onGoToTop={goToTop}
        />
      )}
      {screen === 'game' && (
        <GamePlay
          nickname={nickname}
          players={players}
          gamePhase={gamePhase}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          countdownNum={countdownNum}
          buzzerWinner={buzzerWinner}
          isMyBuzzer={isMyBuzzer}
          lastResult={lastResult}
          isPlaying={audio.isPlaying}
          settings={settings}
          onPressBuzzer={pressBuzzer}
          onSubmitAnswer={submitAnswer}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          nickname={nickname}
          players={players}
          results={finalResults}
          winner={winner}
          isDraw={isDraw}
          onPlayAgain={playAgain}
          onGoToTop={goToTop}
        />
      )}
    </div>
  );
}

export default App;
