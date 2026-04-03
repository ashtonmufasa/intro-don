export interface Player {
  id: string;          // socket.id
  nickname: string;
  score: number;
  isHost: boolean;
}

export interface GameSettings {
  mode: 'genre' | 'artist';
  genres: string[];
  decades: string[];
  artistName: string;
  questionCount: number;
  answerTimeLimit: number; // seconds (0 = unlimited)
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
  passedPlayers: string[];           // socket.ids of players who passed
  answerTimer: ReturnType<typeof setTimeout> | null;
  questionTimer: ReturnType<typeof setTimeout> | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'genre',
  genres: ['J-Pop'],
  decades: ['2020s'],
  artistName: '',
  questionCount: 10,
  answerTimeLimit: 0, // 0 = unlimited
};

// Artist lists per genre x decade for accurate search
export const GENRE_DECADE_ARTISTS: Record<string, Record<string, string[]>> = {
  'J-Pop': {
    '2020s': ['YOASOBI', 'Ado', '藤井風', 'Official髭男dism', 'King Gnu', 'あいみょん', '米津玄師', 'Vaundy', 'back number', '優里', 'Mrs. GREEN APPLE', 'imase', '新しい学校のリーダーズ', 'tuki.', 'Creepy Nuts'],
    '2010s': ['米津玄師', 'あいみょん', 'back number', 'Official髭男dism', '星野源', 'RADWIMPS', 'Perfume', 'ONE OK ROCK', '乃木坂46', '欅坂46', '三代目 J SOUL BROTHERS', '西野カナ', 'SEKAI NO OWARI'],
    '2000s': ['嵐', 'EXILE', '宇多田ヒカル', '浜崎あゆみ', 'BUMP OF CHICKEN', 'Mr.Children', '中島美嘉', '倖田來未', '平井堅', 'ORANGE RANGE', 'GReeeeN', 'コブクロ'],
    '1990s': ['安室奈美恵', 'SPEED', '宇多田ヒカル', 'Mr.Children', "B'z", 'GLAY', "L'Arc~en~Ciel", 'スピッツ', 'DREAMS COME TRUE', 'サザンオールスターズ', 'SMAP'],
    '1980s': ['松田聖子', '中森明菜', 'サザンオールスターズ', 'BOØWY', 'チェッカーズ', 'THE BLUE HEARTS', '荻野目洋子', '小泉今日子', 'TM NETWORK'],
  },
  'Anime': {
    '2020s': ['YOASOBI', 'Ado', 'LiSA', 'Official髭男dism', 'King Gnu', '米津玄師', 'Aimer', 'Eve', '女王蜂', 'Creepy Nuts', 'Vaundy', 'Mrs. GREEN APPLE'],
    '2010s': ['LiSA', 'Aimer', 'RADWIMPS', 'BUMP OF CHICKEN', '藍井エイル', 'ClariS', 'fripSide', 'EGOIST', 'FLOW'],
    '2000s': ['ORANGE RANGE', 'YUI', 'いきものがかり', 'ASIAN KUNG-FU GENERATION', 'ポルノグラフィティ', "L'Arc~en~Ciel", 'UVERworld'],
    '1990s': ['WANDS', 'DEEN', 'ZARD', 'TWO-MIX', '林原めぐみ'],
    '1980s': ['影山ヒロノブ', '串田アキラ', '水木一郎'],
  },
  'K-Pop': {
    '2020s': ['BTS', 'BLACKPINK', 'Stray Kids', 'aespa', 'NewJeans', 'LE SSERAFIM', 'IVE', 'SEVENTEEN', 'TWICE', 'ITZY', 'TXT', '(G)I-DLE', 'NMIXX'],
    '2010s': ['BTS', 'BLACKPINK', 'TWICE', 'EXO', 'RED VELVET', 'GOT7', 'SEVENTEEN', 'BIGBANG', '2NE1', 'SHINee', "Girls' Generation", 'PSY'],
  },
  'Rock': {
    '2020s': ['Maneskin', 'Wet Leg', 'Turnstile', 'Ghost', 'Greta Van Fleet'],
    '2010s': ['Imagine Dragons', 'Twenty One Pilots', 'Arctic Monkeys', 'Royal Blood', 'Tame Impala', 'Foo Fighters'],
    '2000s': ['Linkin Park', 'Green Day', 'Muse', 'Arctic Monkeys', 'The Killers', 'Red Hot Chili Peppers', 'Coldplay', 'System of a Down'],
  },
  'Pop': {
    '2020s': ['Taylor Swift', 'Olivia Rodrigo', 'Dua Lipa', 'Harry Styles', 'The Weeknd', 'Bad Bunny', 'Doja Cat', 'Billie Eilish', 'SZA', 'Sabrina Carpenter'],
    '2010s': ['Taylor Swift', 'Ed Sheeran', 'Ariana Grande', 'Bruno Mars', 'Adele', 'Billie Eilish', 'Post Malone', 'Drake', 'Rihanna', 'Justin Bieber'],
  },
  'Hip-Hop': {
    '2020s': ['Kendrick Lamar', 'Drake', 'Travis Scott', '21 Savage', 'Future', 'Metro Boomin', 'Lil Baby', 'Jack Harlow'],
    '2010s': ['Kendrick Lamar', 'Drake', 'Kanye West', 'J. Cole', 'Travis Scott', 'Post Malone', 'Tyler, The Creator'],
  },
  'R&B': {
    '2020s': ['SZA', 'The Weeknd', 'Daniel Caesar', 'Steve Lacy', 'Giveon', 'Summer Walker'],
    '2010s': ['The Weeknd', 'Frank Ocean', 'SZA', 'Khalid', 'H.E.R.', 'Miguel', 'Anderson .Paak'],
  },
  'Electronic': {
    '2020s': ['Fred again..', 'Skrillex', 'ODESZA', 'Peggy Gou', 'Bicep'],
    '2010s': ['Avicii', 'Calvin Harris', 'Marshmello', 'The Chainsmokers', 'Kygo', 'Martin Garrix', 'Daft Punk', 'Skrillex'],
  },
};

// Fallback keyword queries (used when no artist list exists)
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
