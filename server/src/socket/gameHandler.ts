import { Server, Socket } from 'socket.io';
import { rooms } from './roomHandler';
import { fetchQuestions } from '../services/deezerService';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { QuestionResult } from '../types/game';

const ANSWER_TIME_LIMIT = 10000; // 10 seconds for answering after buzzer

export function registerGameHandlers(io: Server, socket: Socket) {

  // Start game (host only)
  socket.on('game:start', async (data: { roomId: string }, callback: (response: any) => void) => {
    const room = rooms.get(data.roomId);
    if (!room) {
      callback({ success: false, error: 'ルームが見つかりません' });
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      callback({ success: false, error: 'ホストのみゲームを開始できます' });
      return;
    }

    if (room.players.length < 2) {
      callback({ success: false, error: '2人揃わないとゲームを開始できません' });
      return;
    }

    // Reset scores
    room.players.forEach(p => p.score = 0);
    room.questionResults = [];
    room.currentQuestion = -1;

    // Notify that we're loading questions
    io.to(data.roomId).emit('game:loading', { message: '楽曲を読み込み中...' });

    try {
      // Fetch questions from Deezer
      const questions = await fetchQuestions(
        room.settings.genres,
        room.settings.decades,
        room.settings.questionCount
      );

      if (questions.length === 0) {
        callback({ success: false, error: '楽曲が見つかりませんでした。ジャンルや年代を変更してください。' });
        io.to(data.roomId).emit('game:loading-failed', { message: '楽曲が見つかりませんでした' });
        return;
      }

      room.questions = questions;
      room.state = 'playing';

      callback({ success: true, totalQuestions: questions.length });

      // Start the game with countdown
      io.to(data.roomId).emit('game:started', {
        totalQuestions: questions.length,
        settings: room.settings,
        players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: 0 })),
      });

      // Start first question after a brief delay
      setTimeout(() => startQuestion(io, data.roomId), 1500);

    } catch (error) {
      console.error('Error fetching questions:', error);
      callback({ success: false, error: '楽曲の取得に失敗しました' });
    }
  });

  // Buzzer press
  socket.on('buzzer:press', (data: { roomId: string; timestamp: number }) => {
    const room = rooms.get(data.roomId);
    if (!room || room.state !== 'playing') return;
    if (room.buzzerLocked) return;

    // First press wins
    room.buzzerLocked = true;
    room.buzzerWinner = socket.id;

    const winner = room.players.find(p => p.id === socket.id);
    if (!winner) return;

    // Stop the question timer
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
      room.questionTimer = null;
    }

    // Notify all players
    io.to(data.roomId).emit('game:buzzer-result', {
      winnerNickname: winner.nickname,
      winnerId: socket.id,
    });

    // Start answer timer (10 seconds)
    room.answerTimer = setTimeout(() => {
      // Time's up for answering
      handleAnswerTimeout(io, data.roomId);
    }, ANSWER_TIME_LIMIT);
  });

  // Answer submit
  socket.on('answer:submit', (data: { roomId: string; answer: string }) => {
    const room = rooms.get(data.roomId);
    if (!room || room.state !== 'playing') return;
    if (room.buzzerWinner !== socket.id) return;

    // Clear answer timer
    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const currentQ = room.questions[room.currentQuestion];
    if (!currentQ) return;

    const isCorrect = fuzzyMatch(data.answer, currentQ.trackName);
    const player = room.players.find(p => p.id === socket.id);

    if (isCorrect && player) {
      player.score += 1;
    }

    const result: QuestionResult = {
      questionIndex: room.currentQuestion,
      trackName: currentQ.trackName,
      artistName: currentQ.artistName,
      albumImageUrl: currentQ.albumImageUrl,
      buzzWinner: player?.nickname || null,
      answer: data.answer,
      isCorrect,
      correctAnswer: currentQ.trackName,
    };
    room.questionResults.push(result);

    // Send answer result to all
    io.to(data.roomId).emit('game:answer-result', {
      ...result,
      players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
    });

    // Proceed to next question after delay
    setTimeout(() => {
      if (room.currentQuestion + 1 < room.questions.length) {
        startQuestion(io, data.roomId);
      } else {
        endGame(io, data.roomId);
      }
    }, 3000);
  });

  // Play again
  socket.on('game:play-again', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    room.state = 'waiting';
    room.questions = [];
    room.currentQuestion = -1;
    room.questionResults = [];
    room.buzzerLocked = true;
    room.buzzerWinner = null;
    room.players.forEach(p => p.score = 0);

    io.to(data.roomId).emit('game:reset', {
      players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: 0 })),
      settings: room.settings,
    });
  });
}

function startQuestion(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.currentQuestion += 1;
  room.buzzerLocked = true;
  room.buzzerWinner = null;

  const qIndex = room.currentQuestion;
  const question = room.questions[qIndex];
  if (!question) return;

  // Send countdown
  io.to(roomId).emit('game:countdown', {
    questionNumber: qIndex + 1,
    totalQuestions: room.questions.length,
  });

  // After countdown (3 seconds), play intro
  setTimeout(() => {
    room.buzzerLocked = false;

    // Send preview URL to play
    io.to(roomId).emit('game:play-intro', {
      questionNumber: qIndex + 1,
      totalQuestions: room.questions.length,
      previewUrl: question.previewUrl,
    });

    // Start question timer
    room.questionTimer = setTimeout(() => {
      handleTimeUp(io, roomId);
    }, room.settings.timeLimit * 1000);

  }, 3000);
}

function handleTimeUp(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.buzzerLocked = true;

  const currentQ = room.questions[room.currentQuestion];
  if (!currentQ) return;

  const result: QuestionResult = {
    questionIndex: room.currentQuestion,
    trackName: currentQ.trackName,
    artistName: currentQ.artistName,
    albumImageUrl: currentQ.albumImageUrl,
    buzzWinner: null,
    answer: null,
    isCorrect: false,
    correctAnswer: currentQ.trackName,
  };
  room.questionResults.push(result);

  io.to(roomId).emit('game:time-up', {
    ...result,
    players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
  });

  // Next question after delay
  setTimeout(() => {
    if (room.currentQuestion + 1 < room.questions.length) {
      startQuestion(io, roomId);
    } else {
      endGame(io, roomId);
    }
  }, 3000);
}

function handleAnswerTimeout(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const currentQ = room.questions[room.currentQuestion];
  const buzzerPlayer = room.players.find(p => p.id === room.buzzerWinner);
  if (!currentQ) return;

  const result: QuestionResult = {
    questionIndex: room.currentQuestion,
    trackName: currentQ.trackName,
    artistName: currentQ.artistName,
    albumImageUrl: currentQ.albumImageUrl,
    buzzWinner: buzzerPlayer?.nickname || null,
    answer: null,
    isCorrect: false,
    correctAnswer: currentQ.trackName,
  };
  room.questionResults.push(result);

  io.to(roomId).emit('game:answer-result', {
    ...result,
    players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
  });

  // Next question
  setTimeout(() => {
    if (room.currentQuestion + 1 < room.questions.length) {
      startQuestion(io, roomId);
    } else {
      endGame(io, roomId);
    }
  }, 3000);
}

function endGame(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.state = 'finished';
  room.buzzerLocked = true;

  const players = room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score }));
  const sorted = [...players].sort((a, b) => b.score - a.score);

  let winnerNickname: string | null = null;
  let isDraw = false;

  if (sorted.length >= 2 && sorted[0].score === sorted[1].score) {
    isDraw = true;
  } else if (sorted.length > 0) {
    winnerNickname = sorted[0].nickname;
  }

  io.to(roomId).emit('game:finished', {
    players,
    results: room.questionResults,
    winner: winnerNickname,
    isDraw,
  });
}
