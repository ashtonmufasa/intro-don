export interface Player {
  id: string;          // socket.id
  nickname: string;
  score: number;
  isHost: boolean;
}

export interface GameSettings {
  genres: string[];
  decades: string[];
  questionCount: number;
  timeLimit: number;   // seconds per question for buzzer
}

export interface QuestionData {
  id: number;
  previewUrl: string;
  trackName: string;
  artistName: string;
  albumImageUrl: string;
}

export interface QuestionResult {
  questionIndex: number;
  trackName: string;
  artistName: string;
  albumImageUrl: string;
  buzzWinner: string | null;       // nickname
  answer: string | null;
  isCorrect: boolean;
  correctAnswer: string;
}

export type RoomState = 'waiting' | 'settings' | 'playing' | 'finished';

export interface Room {
  id: string;
  players: Player[];
  state: RoomState;
  settings: GameSettings;
  questions: QuestionData[];
  currentQuestion: number;
  questionResults: QuestionResult[];
  buzzerLocked: boolean;
  buzzerWinner: string | null;       // socket.id
  answerTimer: ReturnType<typeof setTimeout> | null;
  questionTimer: ReturnType<typeof setTimeout> | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
  genres: ['J-Pop'],
  decades: ['2020s'],
  questionCount: 10,
  timeLimit: 15,
};

// Deezer search query mappings
export const GENRE_QUERIES: Record<string, string[]> = {
  'J-Pop': ['jpop', 'j-pop', '邦楽'],
  'Pop': ['pop hits', 'pop music'],
  'Rock': ['rock', 'ロック'],
  'R&B': ['r&b', 'rnb'],
  'Hip-Hop': ['hiphop', 'hip-hop', 'ラップ'],
  'Anime': ['anime song', 'アニソン', 'anime opening'],
  'Electronic': ['edm', 'electronic', 'エレクトロ'],
  'K-Pop': ['kpop', 'k-pop', '韓国'],
};

export const DECADE_KEYWORDS: Record<string, string[]> = {
  '1980s': ['1980', '1985', '80s'],
  '1990s': ['1990', '1995', '90s'],
  '2000s': ['2000', '2005', '2000s'],
  '2010s': ['2010', '2015', '2010s'],
  '2020s': ['2020', '2023', '2024', '2025'],
};
