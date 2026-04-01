import { QuestionData, GENRE_QUERIES, DECADE_KEYWORDS } from '../types/game';

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

export async function fetchQuestions(
  genres: string[],
  decades: string[],
  count: number
): Promise<QuestionData[]> {
  const allTracks: Map<number, DeezerTrack> = new Map();

  // Build search queries by combining genre and decade keywords
  const queries: string[] = [];

  for (const genre of genres) {
    const genreKeywords = GENRE_QUERIES[genre] || [genre.toLowerCase()];

    if (decades.length > 0) {
      for (const decade of decades) {
        const decadeKeywords = DECADE_KEYWORDS[decade] || [];
        // Combine first genre keyword with first decade keyword
        for (const gk of genreKeywords.slice(0, 2)) {
          for (const dk of decadeKeywords.slice(0, 2)) {
            queries.push(`${gk} ${dk}`);
          }
        }
      }
    } else {
      for (const gk of genreKeywords) {
        queries.push(gk);
      }
    }
  }

  // Also add plain genre queries for more results
  for (const genre of genres) {
    const genreKeywords = GENRE_QUERIES[genre] || [genre.toLowerCase()];
    queries.push(genreKeywords[0]);
  }

  // Deduplicate queries
  const uniqueQueries = [...new Set(queries)];

  // Execute searches with rate limiting (max 3 concurrent)
  const batchSize = 3;
  for (let i = 0; i < uniqueQueries.length; i += batchSize) {
    const batch = uniqueQueries.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(q => searchDeezer(q, 50)));

    for (const tracks of results) {
      for (const track of tracks) {
        // Only include tracks with preview URLs
        if (track.preview && track.preview.length > 0) {
          allTracks.set(track.id, track);
        }
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < uniqueQueries.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // If not enough tracks, try broader searches
  if (allTracks.size < count) {
    const fallbackQueries = ['top hits', 'popular music', 'ヒット曲', 'chart hits'];
    for (const q of fallbackQueries) {
      if (allTracks.size >= count * 2) break;
      const tracks = await searchDeezer(q, 50);
      for (const track of tracks) {
        if (track.preview && track.preview.length > 0) {
          allTracks.set(track.id, track);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Shuffle and pick the requested number
  const shuffled = shuffleArray([...allTracks.values()]);
  const selected = shuffled.slice(0, count);

  return selected.map(track => ({
    id: track.id,
    previewUrl: track.preview,
    trackName: track.title,
    artistName: track.artist.name,
    albumImageUrl: track.album.cover_medium,
  }));
}

// Express route handler for generic search (used by client if needed)
export async function handleSearch(query: string, limit: number = 25) {
  const tracks = await searchDeezer(query, limit);
  return { data: tracks };
}
