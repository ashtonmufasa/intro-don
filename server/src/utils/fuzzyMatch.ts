import { distance } from 'fastest-levenshtein';

// Katakana to Hiragana conversion
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

// Full-width to half-width conversion
function fullWidthToHalfWidth(str: string): string {
  return str
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    )
    .replace(/\u3000/g, ' ');
}

// Normalize long vowel marks
function normalizeLongVowel(str: string): string {
  return str.replace(/[ー\-−―]/g, '');
}

// Remove particles and common noise
function removeParticles(str: string): string {
  return str.replace(/[のはをがでにへとやもか]/g, '');
}

// Remove punctuation and spaces
function removePunctuation(str: string): string {
  return str.replace(/[\s\.\,\!\?\;\:\'\"\-\_\(\)\[\]\{\}\/\\「」『』【】（）・、。！？〜～♪♡★☆…]/g, '');
}

// Comprehensive normalization
function normalize(str: string): string {
  let s = str;
  s = fullWidthToHalfWidth(s);
  s = s.toLowerCase();
  s = katakanaToHiragana(s);
  s = normalizeLongVowel(s);
  s = removePunctuation(s);
  s = removeParticles(s);
  s = s.trim();
  return s;
}

export function fuzzyMatch(answer: string, correct: string): boolean {
  const normAnswer = normalize(answer);
  const normCorrect = normalize(correct);

  if (!normAnswer || !normCorrect) return false;

  // Exact match after normalization
  if (normAnswer === normCorrect) return true;

  // Containment check (either direction)
  if (normCorrect.includes(normAnswer) && normAnswer.length >= 2) return true;
  if (normAnswer.includes(normCorrect) && normCorrect.length >= 2) return true;

  // Levenshtein distance check (within 30% of the correct string length)
  const maxLen = Math.max(normAnswer.length, normCorrect.length);
  const threshold = Math.ceil(maxLen * 0.3);
  const dist = distance(normAnswer, normCorrect);

  if (dist <= threshold) return true;

  return false;
}
