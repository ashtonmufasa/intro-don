import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useAudio } from './hooks/useAudio';
import { useSoundEffects } from './hooks/useSoundEffects';
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
  mode: 'genre' | 'artist';
  genres: string[];
  decades: string[];
  artistName: string;
  questionCount: number;
  answerTimeLimit: number; // seconds (0 = unlimited)
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
  const sfx = useSoundEffects();

  const [screen, setScreen] = useState<Screen>('top');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'genre',
    genres: ['J-Pop'],
    decades: ['2020s'],
    artistName: '',
    questionCount: 10,
    answerTimeLimit: 0,
  });
  const [error, setError] = useState('');

  // Game state
  const [gamePhase, setGamePhase] = useState<'loading' | 'countdown' | 'playing' | 'buzzer-won' | 'answering' | 'result' | 'time-up' | 'passed' | 'wrong-transfer'>('loading');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [buzzerWinner, setBuzzerWinner] = useState<string | null>(null);
  const [isMyBuzzer, setIsMyBuzzer] = useState(false);
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null);
  const [myPassed, setMyPassed] = useState(false);
  const [wrongPlayerNickname, setWrongPlayerNickname] = useState<string | null>(null);
  const [answerTimeLimit, setAnswerTimeLimit] = useState(0);

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

    cleanups.push(on('game:started', (data: { totalQuestions: number; players: PlayerInfo[]; settings: GameSettings }) => {
      setTotalQuestions(data.totalQuestions);
      setPlayers(data.players);
      setAnswerTimeLimit(data.settings.answerTimeLimit || 0);
      setScreen('game');
    }));

    cleanups.push(on('game:countdown', (data: { questionNumber: number; totalQuestions: number }) => {
      setGamePhase('countdown');
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setBuzzerWinner(null);
      setIsMyBuzzer(false);
      setLastResult(null);
      setMyPassed(false);
      setWrongPlayerNickname(null);

      setCountdownNum(3);
      sfx.playCountdownBeep(3);
      setTimeout(() => { setCountdownNum(2); sfx.playCountdownBeep(2); }, 1000);
      setTimeout(() => { setCountdownNum(1); sfx.playCountdownBeep(1); }, 2000);
    }));

    cleanups.push(on('game:play-intro', (data: { questionNumber: number; totalQuestions: number; previewUrl: string }) => {
      setGamePhase('playing');
      setQuestionNumber(data.questionNumber);
      audio.play(data.previewUrl);
    }));

    cleanups.push(on('game:buzzer-result', (data: { winnerNickname: string; winnerId: string }) => {
      audio.stop();
      setBuzzerWinner(data.winnerNickname);
      const isMine = data.winnerNickname === nickname;
      setIsMyBuzzer(isMine);
      setGamePhase(isMine ? 'answering' : 'buzzer-won');
    }));

    // Answer result (question is OVER — correct, or both failed)
    cleanups.push(on('game:answer-result', (data: QuestionResult & { players: PlayerInfo[]; showAnswer: boolean; bothFailed: boolean }) => {
      setGamePhase('result');
      setLastResult(data);
      setPlayers(data.players);
      if (data.isCorrect) {
        sfx.playCorrectSound();
      } else {
        sfx.playWrongSound();
      }
    }));

    // Wrong answer but question continues (other player gets a turn)
    cleanups.push(on('game:wrong-no-reveal', (data: { wrongPlayerNickname: string; answer: string | null; players: PlayerInfo[]; isTimeUp?: boolean }) => {
      audio.stop();
      setGamePhase('wrong-transfer');
      setWrongPlayerNickname(data.wrongPlayerNickname);
      setPlayers(data.players);
      sfx.playWrongSound();
    }));

    cleanups.push(on('game:answer-turn-changed', (data: { message: string; wrongPlayerNickname: string; previewUrl: string; questionNumber: number; totalQuestions: number; players: PlayerInfo[] }) => {
      setPlayers(data.players);
      setGamePhase('playing');
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setBuzzerWinner(null);
      setIsMyBuzzer(false);
      setLastResult(null);
      setWrongPlayerNickname(null);
      if (data.previewUrl) {
        audio.play(data.previewUrl);
      }
    }));

    cleanups.push(on('game:player-passed', (data: { nickname: string; passedPlayers: string[] }) => {
      if (data.nickname === nickname) {
        setMyPassed(true);
      }
    }));

    cleanups.push(on('game:pass-complete', (data: QuestionResult & { players: PlayerInfo[] }) => {
      audio.stop();
      setGamePhase('passed');
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
  }, [on, nickname, audio, sfx]);

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

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    emit('room:update-settings', { roomId, settings: newSettings });
  }, [emit, roomId, settings]);

  const startGame = useCallback(() => {
    setError('');
    emit('game:start', { roomId }, (response: any) => {
      if (!response.success) {
        setError(response.error || 'ゲームの開始に失敗しました');
      }
    });
  }, [emit, roomId]);

  const pressBuzzer = useCallback(() => {
    emit('buzzer:press', { roomId, timestamp: Date.now() });
  }, [emit, roomId]);

  const submitAnswer = useCallback((answer: string) => {
    emit('answer:submit', { roomId, answer });
  }, [emit, roomId]);

  const passBuzzer = useCallback(() => {
    emit('buzzer:pass', { roomId });
  }, [emit, roomId]);

  const playAgain = useCallback(() => {
    emit('game:play-again', { roomId });
  }, [emit, roomId]);

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
          myPassed={myPassed}
          wrongPlayerNickname={wrongPlayerNickname}
          answerTimeLimit={answerTimeLimit}
          onPressBuzzer={pressBuzzer}
          onSubmitAnswer={submitAnswer}
          onPass={passBuzzer}
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
