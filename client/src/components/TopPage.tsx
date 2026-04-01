import { useState } from 'react';

interface TopPageProps {
  connected: boolean;
  error: string;
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (nickname: string, roomId: string) => void;
}

export default function TopPage({ connected, error, onCreateRoom, onJoinRoom }: TopPageProps) {
  const [nickname, setNickname] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [mode, setMode] = useState<'main' | 'join'>('main');

  const canAction = nickname.trim().length > 0 && connected;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-zen font-black neon-text mb-2">
          <span className="text-neon-yellow">&#127925;</span> イントロドン！
        </h1>
        <p className="text-gray-400 text-lg">リアルタイム対戦イントロクイズ</p>
      </div>

      {/* Connection status */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-neon-green' : 'bg-red-500'} animate-pulse`} />
        <span className="text-sm text-gray-400">
          {connected ? 'サーバー接続済み' : 'サーバーに接続中...'}
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-dark-surface rounded-2xl p-8 shadow-lg border border-gray-700/50">
        {/* Nickname input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">ニックネーム</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="名前を入力..."
            maxLength={12}
            className="w-full bg-dark-card border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-colors"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {mode === 'main' ? (
          <div className="space-y-4">
            {/* Create Room */}
            <button
              onClick={() => canAction && onCreateRoom(nickname.trim())}
              disabled={!canAction}
              className="w-full py-4 bg-gradient-to-r from-neon-pink to-purple-600 rounded-xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-neon-pink/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              ルームを作成する
            </button>

            {/* Join Room */}
            <button
              onClick={() => setMode('join')}
              disabled={!canAction}
              className="w-full py-4 bg-dark-card border-2 border-neon-cyan rounded-xl text-neon-cyan font-bold text-lg transition-all hover:bg-neon-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              ルームに参加する
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Room ID input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">ルームID</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="6桁のルームIDを入力..."
                maxLength={6}
                className="w-full bg-dark-card border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-2xl font-orbitron tracking-widest placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors"
              />
            </div>

            <button
              onClick={() => joinRoomId.length === 6 && canAction && onJoinRoom(nickname.trim(), joinRoomId)}
              disabled={!canAction || joinRoomId.length !== 6}
              className="w-full py-4 bg-gradient-to-r from-neon-cyan to-blue-600 rounded-xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-neon-cyan/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              参加する
            </button>

            <button
              onClick={() => {
                setMode('main');
                setJoinRoomId('');
              }}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors"
            >
              ← 戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
