import { Server, Socket } from 'socket.io';
import { Room, Player, DEFAULT_SETTINGS, GameSettings } from '../types/game';

// In-memory room storage
export const rooms: Map<string, Room> = new Map();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function getPlayerBySocketId(room: Room, socketId: string): Player | undefined {
  return room.players.find(p => p.id === socketId);
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Create room
  socket.on('room:create', (data: { nickname: string }, callback: (response: any) => void) => {
    let roomId = generateRoomId();
    while (rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const player: Player = {
      id: socket.id,
      nickname: data.nickname,
      score: 0,
      isHost: true,
    };

    const room: Room = {
      id: roomId,
      players: [player],
      state: 'waiting',
      settings: { ...DEFAULT_SETTINGS },
      questions: [],
      currentQuestion: -1,
      questionResults: [],
      buzzerLocked: true,
      buzzerWinner: null,
      passedPlayers: [],
      answerTimer: null,
      questionTimer: null,
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    console.log(`Room ${roomId} created by ${data.nickname}`);

    callback({ success: true, roomId, player });
  });

  // Join room
  socket.on('room:join', (data: { roomId: string; nickname: string }, callback: (response: any) => void) => {
    const room = rooms.get(data.roomId);

    if (!room) {
      callback({ success: false, error: 'ルームが見つかりません' });
      return;
    }

    if (room.players.length >= 2) {
      callback({ success: false, error: 'ルームが満員です' });
      return;
    }

    if (room.state !== 'waiting') {
      callback({ success: false, error: 'ゲームが既に開始されています' });
      return;
    }

    const player: Player = {
      id: socket.id,
      nickname: data.nickname,
      score: 0,
      isHost: false,
    };

    room.players.push(player);
    socket.join(data.roomId);

    console.log(`${data.nickname} joined room ${data.roomId}`);

    // Notify all players in the room
    io.to(data.roomId).emit('room:player-joined', {
      players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
    });

    callback({
      success: true,
      roomId: data.roomId,
      player,
      players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
      settings: room.settings,
    });
  });

  // Update settings (host only)
  socket.on('room:update-settings', (data: { roomId: string; settings: Partial<GameSettings> }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    const player = getPlayerBySocketId(room, socket.id);
    if (!player || !player.isHost) return;

    room.settings = { ...room.settings, ...data.settings };

    // Broadcast settings to all players
    io.to(data.roomId).emit('room:settings-updated', { settings: room.settings });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) continue;

      const player = room.players[playerIndex];
      console.log(`${player.nickname} disconnected from room ${roomId}`);

      room.players.splice(playerIndex, 1);

      // Clear timers
      if (room.answerTimer) clearTimeout(room.answerTimer);
      if (room.questionTimer) clearTimeout(room.questionTimer);

      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Notify remaining player
        io.to(roomId).emit('room:player-disconnected', {
          nickname: player.nickname,
          players: room.players.map(p => ({ nickname: p.nickname, isHost: p.isHost, score: p.score })),
        });

        // If game was in progress, pause it
        if (room.state === 'playing') {
          room.state = 'waiting';
          io.to(roomId).emit('game:paused', { reason: `${player.nickname} が切断しました` });
        }

        // If host left, promote remaining player
        if (player.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          io.to(roomId).emit('room:host-changed', { nickname: room.players[0].nickname });
        }
      }
    }
  });
}
