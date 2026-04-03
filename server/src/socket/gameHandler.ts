import { Server, Socket } from 'socket.io';
import { rooms } from './roomHandler';
import { fetchQuestions, fetchQuestionsByArtist } from '../services/deezerService';
import { fuzzyMatch } from '../utils/fuzzyMatch';
import { QuestionResult } from '../types/game';

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
      let questions;

      if (room.settings.mode === 'artist' && room.settings.artistName.trim()) {
        // Artist mode
        questions = await fetchQuestionsByArtist(
          room.settings.artistName.trim(),
          room.settings.questionCount
        );
      } else {
        // Genre mode
        questions = await fetchQuestions(
          room.settings.genres,
          room.settings.decades,
          room.settings.questionCount
        );
      }

      if (questions.length === 0) {
        const errorMsg = room.settings.mode === 'artist'
          ? `「${room.settings.artistName}」の楽曲が見つかりませんでした。アーティスト名を確認してください。`
          : '楽曲が見つかりませんでした。ジャンルや年代を変更してください。';
        callback({ success: false, error: errorMsg });
        io.to(data.roomId).emit('game:loading-failed', { message: errorMsg });
        return;
      }

      room.questions = questions;
      room.state = 'playing';

      callback({ success: true, totalQuestions: questions.length });

      io.to(data.roomId).emit('game:started', {
        totalQuestions: questions.length,
        settings: room.settings,
        players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: 0 })),
      });

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

    // Check if this player already passed
    if (room.passedPlayers.includes(socket.id)) return;

    // First press wins
    room.buzzerLocked = true;
    room.buzzerWinner = socket.id;

    const winner = room.players.find(p => p.id === socket.id);
    if (!winner) return;

    io.to(data.roomId).emit('game:buzzer-result', {
      winnerNickname: winner.nickname,
      winnerId: socket.id,
    });

    // No answer timer — unlimited time
  });

  // Answer submit
  socket.on('answer:submit', (data: { roomId: string; answer: string }) => {
    const room = rooms.get(data.roomId);
    if (!room || room.state !== 'playing') return;
    if (room.buzzerWinner !== socket.id) return;

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

    io.to(data.roomId).emit('game:answer-result', {
      ...result,
      players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
    });

    // If wrong answer, give the other player a chance (unlock buzzer)
    if (!isCorrect) {
      setTimeout(() => {
        if (!room) return;
        // Add this player to passed (they got it wrong, can't buzz again)
        if (!room.passedPlayers.includes(socket.id)) {
          room.passedPlayers.push(socket.id);
        }

        // Check if all players have either passed or answered wrong
        const allDone = room.players.every(p => room.passedPlayers.includes(p.id));
        if (allDone) {
          // Skip to next question
          setTimeout(() => advanceQuestion(io, data.roomId), 1500);
        } else {
          // Re-open buzzer for other player
          room.buzzerLocked = false;
          room.buzzerWinner = null;
          io.to(data.roomId).emit('game:answer-turn-changed', {
            message: '相手に回答権が移りました',
            players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
          });
        }
      }, 2000);
    } else {
      // Correct — move to next question
      setTimeout(() => advanceQuestion(io, data.roomId), 3000);
    }
  });

  // Pass (during buzzer phase or answering phase)
  socket.on('buzzer:pass', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room || room.state !== 'playing') return;

    // If this player is currently answering, they forfeit answer
    if (room.buzzerWinner === socket.id) {
      room.buzzerWinner = null;
    }

    // Mark player as passed
    if (!room.passedPlayers.includes(socket.id)) {
      room.passedPlayers.push(socket.id);
    }

    const player = room.players.find(p => p.id === socket.id);
    io.to(data.roomId).emit('game:player-passed', {
      nickname: player?.nickname || '',
      passedPlayers: room.passedPlayers.map(id => {
        const p = room.players.find(pl => pl.id === id);
        return p?.nickname || '';
      }),
    });

    // Check if all players have passed
    const allPassed = room.players.every(p => room.passedPlayers.includes(p.id));
    if (allPassed) {
      // Both passed — show correct answer and skip
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

      io.to(data.roomId).emit('game:pass-complete', {
        ...result,
        players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
      });

      setTimeout(() => advanceQuestion(io, data.roomId), 3000);
    } else {
      // One player passed, other can still buzz
      room.buzzerLocked = false;
      room.buzzerWinner = null;
    }
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
    room.passedPlayers = [];
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
  room.passedPlayers = [];

  const qIndex = room.currentQuestion;
  const question = room.questions[qIndex];
  if (!question) return;

  // Send countdown
  io.to(roomId).emit('game:countdown', {
    questionNumber: qIndex + 1,
    totalQuestions: room.questions.length,
  });

  // After countdown (3 seconds), play intro — no time limit
  setTimeout(() => {
    room.buzzerLocked = false;

    io.to(roomId).emit('game:play-intro', {
      questionNumber: qIndex + 1,
      totalQuestions: room.questions.length,
      previewUrl: question.previewUrl,
    });

    // No question timer — unlimited listening time
  }, 3000);
}

function advanceQuestion(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.currentQuestion + 1 < room.questions.length) {
    startQuestion(io, roomId);
  } else {
    endGame(io, roomId);
  }
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
