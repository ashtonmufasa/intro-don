import { QuestionData, GENRE_DECADE_ARTISTS, GENRE_QUERIES, DECADE_KEYWORDS } from '../types/game';

const DEEZER_API = 'https://api.deezer.com';

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: { name: string; picture_medium: string };
  album: { title: string; cover_medium: string };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

async function searchDeezer(query: string, limit: number = 50): Promise<DeezerTrack[]> {
  try {
    const url = `${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as DeezerSearchResponse;
    return data.data || [];
  } catch (error) {
    console.error(`Deezer search error for "${query}":`, error);
    return [];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterValidTracks(tracks: DeezerTrack[]): DeezerTrack[] {
  return tracks.filter(t => t.preview && t.preview.length > 0);
}

async function searchByArtist(artistName: string, limit: number = 25): Promise<DeezerTrack[]> {
  const tracks = await searchDeezer(`artist:"${artistName}"`, limit);
  const valid = filterValidTracks(tracks);
  if (valid.length > 0) return valid;
  const fallback = await searchDeezer(artistName, limit);
  return filterValidTracks(fallback);
}

// Select tracks ensuring no duplicate artists (Fix 2)
function selectWithArtistDedup(tracks: DeezerTrack[], count: number): DeezerTrack[] {
  const shuffled = shuffleArray(tracks);
  const selected: DeezerTrack[] = [];
  const usedArtists = new Set<string>();

  // First pass: one song per artist
  for (const track of shuffled) {
    if (selected.length >= count) break;
    const artistKey = track.artist.name.toLowerCase();
    if (!usedArtists.has(artistKey)) {
      usedArtists.add(artistKey);
      selected.push(track);
    }
  }

  // If not enough, allow duplicates
  if (selected.length < count) {
    for (const track of shuffled) {
      if (selected.length >= count) break;
      if (!selected.some(s => s.id === track.id)) {
        selected.push(track);
      }
    }
  }

  return selected;
}

function toQuestionData(tracks: DeezerTrack[]): QuestionData[] {
  return tracks.map(track => ({
    id: track.id,
    previewUrl: track.preview,
    trackName: track.title,
    artistName: track.artist.name,
    albumImageUrl: track.album.cover_medium,
  }));
}

// Fetch questions by artist name (artist mode) — Fix 3: support decades
export async function fetchQuestionsByArtist(
  artistName: string,
  count: number,
  decades: string[] = []
): Promise<QuestionData[]> {
  const allTracks: Map<number, DeezerTrack> = new Map();

  // Primary search
  const tracks = await searchByArtist(artistName, 50);
  for (const track of tracks) {
    allTracks.set(track.id, track);
  }

  // Also search with decade keywords if specified
  if (decades.length > 0) {
    for (const decade of decades) {
      const decadeKeywords = DECADE_KEYWORDS[decade] || [];
      for (const dk of decadeKeywords.slice(0, 2)) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const moreTracks = await searchDeezer(`${artistName} ${dk}`, 30);
        for (const track of filterValidTracks(moreTracks)) {
          allTracks.set(track.id, track);
        }
      }
    }
  }

  // If not enough, broader search
  if (allTracks.size < count) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const moreTracks = await searchDeezer(artistName, 50);
    for (const track of filterValidTracks(moreTracks)) {
      allTracks.set(track.id, track);
    }
  }

  const shuffled = shuffleArray([...allTracks.values()]);
  const selected = shuffled.slice(0, count);

  return toQuestionData(selected);
}

// Fetch questions by genre + decade — with artist dedup (Fix 2)
export async function fetchQuestions(
  genres: string[],
  decades: string[],
  count: number
): Promise<QuestionData[]> {
  const allTracks: Map<number, DeezerTrack> = new Map();

  // Collect artists from mapping
  const artists: string[] = [];
  for (const genre of genres) {
    const genreArtists = GENRE_DECADE_ARTISTS[genre];
    if (genreArtists) {
      if (decades.length > 0) {
        for (const decade of decades) {
          const decadeArtists = genreArtists[decade];
          if (decadeArtists) {
            artists.push(...decadeArtists);
          }
        }
      } else {
        for (const decadeArtists of Object.values(genreArtists)) {
          artists.push(...decadeArtists);
        }
      }
    }
  }

  const uniqueArtists = shuffleArray([...new Set(artists)]);

  if (uniqueArtists.length > 0) {
    const batchSize = 3;
    for (let i = 0; i < uniqueArtists.length && allTracks.size < count * 3; i += batchSize) {
      const batch = uniqueArtists.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(a => searchByArtist(a, 15)));

      for (const tracks of results) {
        for (const track of tracks) {
          allTracks.set(track.id, track);
        }
      }

      if (i + batchSize < uniqueArtists.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  // Fallback keyword search
  if (allTracks.size < count) {
    const queries: string[] = [];
    for (const genre of genres) {
      const genreKeywords = GENRE_QUERIES[genre] || [genre.toLowerCase()];
      if (decades.length > 0) {
        for (const decade of decades) {
          const decadeKeywords = DECADE_KEYWORDS[decade] || [];
          for (const gk of genreKeywords.slice(0, 1)) {
            for (const dk of decadeKeywords.slice(0, 1)) {
              queries.push(`${gk} ${dk}`);
            }
          }
        }
      } else {
        queries.push(genreKeywords[0]);
      }
    }

    for (const q of queries) {
      if (allTracks.size >= count * 2) break;
      const tracks = await searchDeezer(q, 50);
      for (const track of filterValidTracks(tracks)) {
        allTracks.set(track.id, track);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Use artist-dedup selection
  const selected = selectWithArtistDedup([...allTracks.values()], count);
  return toQuestionData(selected);
}

export async function handleSearch(query: string, limit: number = 25) {
  const tracks = await searchDeezer(query, limit);
  return { data: tracks };
}
