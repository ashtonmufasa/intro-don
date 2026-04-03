import { useState } from 'react';
import { PlayerInfo, GameSettings } from '../App';

const GENRES = ['J-Pop', 'Pop', 'Rock', 'R&B', 'Hip-Hop', 'Anime', 'Electronic', 'K-Pop'];
const DECADES = ['1980s', '1990s', '2000s', '2010s', '2020s'];

interface WaitingRoomProps {
  roomId: string;
  isHost: boolean;
  players: PlayerInfo[];
  settings: GameSettings;
  disconnectMsg: string;
  error: string;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onGoToTop: () => void;
}

export default function WaitingRoom({
  roomId, isHost, players, settings, disconnectMsg, error,
  onUpdateSettings, onStartGame, onGoToTop,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = roomId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleGenre = (genre: string) => {
    const current = settings.genres;
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    if (updated.length > 0) {
      onUpdateSettings({ genres: updated });
    }
  };

  const toggleDecade = (decade: string) => {
    const current = settings.decades;
    const updated = current.includes(decade)
      ? current.filter(d => d !== decade)
      : [...current, decade];
    if (updated.length > 0) {
      onUpdateSettings({ decades: updated });
    }
  };

  const canStart = players.length === 2;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8">
      {/* Header */}
      <h2 className="text-2xl font-zen font-bold mb-6 neon-text">
        <span className="text-neon-yellow">&#127925;</span> イントロドン！
      </h2>

      {/* Room ID Display */}
      <div className="bg-dark-surface rounded-2xl p-6 mb-6 text-center border border-gray-700/50">
        <p className="text-sm text-gray-400 mb-2">ルームID</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-orbitron font-bold tracking-[0.3em] text-neon-cyan">
            {roomId}
          </span>
          <button
            onClick={copyRoomId}
            className="px-4 py-2 bg-dark-card rounded-lg text-sm border border-gray-600 hover:border-neon-cyan transition-colors"
          >
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">このIDを相手に伝えてください</p>
      </div>

      {disconnectMsg && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-300 text-sm w-full max-w-lg text-center">
          {disconnectMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm w-full max-w-lg text-center">
          {error}
        </div>
      )}

      {/* Players */}
      <div className="w-full max-w-lg bg-dark-surface rounded-2xl p-6 mb-6 border border-gray-700/50">
        <h3 className="text-sm text-gray-400 mb-3">プレイヤー ({players.length}/2)</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-dark-card rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-neon-pink/30 text-neon-pink' : 'bg-neon-cyan/30 text-neon-cyan'}`}>
                  {p.nickname.charAt(0)}
                </div>
                <span className="font-bold">{p.nickname}</span>
              </div>
              {p.isHost && (
                <span className="text-xs bg-neon-yellow/20 text-neon-yellow px-2 py-1 rounded-full">ホスト</span>
              )}
            </div>
          ))}
          {players.length < 2 && (
            <div className="flex items-center justify-center bg-dark-card/50 rounded-xl px-4 py-3 border-2 border-dashed border-gray-600">
              <span className="text-gray-500 animate-pulse">対戦相手を待っています...</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Settings */}
      <div className="w-full max-w-lg bg-dark-surface rounded-2xl p-6 mb-6 border border-gray-700/50">
        <h3 className="text-sm text-gray-400 mb-4">
          {isHost ? 'ゲーム設定' : 'ゲーム設定（ホストが設定中）'}
        </h3>

        {/* Mode Toggle */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2">出題モード</label>
          <div className="flex gap-2">
            <button
              onClick={() => isHost && onUpdateSettings({ mode: 'genre' })}
              disabled={!isHost}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                settings.mode === 'genre'
                  ? 'bg-neon-pink/30 text-neon-pink border border-neon-pink/50'
                  : 'bg-dark-card text-gray-400 border border-gray-600'
              } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
            >
              ジャンルから出題
            </button>
            <button
              onClick={() => isHost && onUpdateSettings({ mode: 'artist' })}
              disabled={!isHost}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                settings.mode === 'artist'
                  ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-dark-card text-gray-400 border border-gray-600'
              } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
            >
              アーティスト指定
            </button>
          </div>
        </div>

        {/* Genre mode: genre selector */}
        {settings.mode === 'genre' && (
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">ジャンル</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => isHost && toggleGenre(g)}
                  disabled={!isHost}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    settings.genres.includes(g)
                      ? 'bg-neon-pink/30 text-neon-pink border border-neon-pink/50'
                      : 'bg-dark-card text-gray-400 border border-gray-600'
                  } ${isHost ? 'hover:border-neon-pink/50 cursor-pointer' : 'cursor-default'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Artist mode: artist name input */}
        {settings.mode === 'artist' && (
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">アーティスト名</label>
            <input
              type="text"
              value={settings.artistName}
              onChange={(e) => isHost && onUpdateSettings({ artistName: e.target.value })}
              disabled={!isHost}
              placeholder="例: YOASOBI, BTS, Taylor Swift..."
              className="w-full bg-dark-card border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors disabled:opacity-50"
            />
          </div>
        )}

        {/* Decade selector - shown in both modes */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2">年代</label>
          <div className="flex flex-wrap gap-2">
            {DECADES.map(d => (
              <button
                key={d}
                onClick={() => isHost && toggleDecade(d)}
                disabled={!isHost}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  settings.decades.includes(d)
                    ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50'
                    : 'bg-dark-card text-gray-400 border border-gray-600'
                } ${isHost ? 'hover:border-neon-cyan/50 cursor-pointer' : 'cursor-default'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question count slider */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">問題数</span>
            <span className="font-orbitron text-neon-yellow">{settings.questionCount}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={settings.questionCount}
            onChange={(e) => isHost && onUpdateSettings({ questionCount: parseInt(e.target.value) })}
            disabled={!isHost}
            className="w-full accent-neon-pink"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-lg space-y-3">
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-4 bg-gradient-to-r from-neon-pink to-purple-600 rounded-xl text-white font-bold text-xl transition-all hover:shadow-lg hover:shadow-neon-pink/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {canStart ? 'ゲームスタート！' : '2人揃うと開始できます'}
          </button>
        )}
        {!isHost && (
          <div className="text-center text-gray-400 py-4">
            ホストがゲームを開始するのを待っています...
          </div>
        )}

        <button
          onClick={onGoToTop}
          className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← トップに戻る
        </button>
      </div>
    </div>
  );
}
