import { distance } from 'fastest-levenshtein';

// Katakana to Hiragana conversion
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

// Hiragana to Katakana conversion
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
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

// Romaji to Hiragana mapping table
const ROMAJI_TO_HIRAGANA: [string, string][] = [
  // Double consonants (must be before single)
  ['sshi', 'っし'], ['cchi', 'っち'], ['tchi', 'っち'],
  ['tte', 'って'], ['tta', 'った'], ['tto', 'っと'], ['tti', 'っち'], ['ttu', 'っつ'],
  ['kka', 'っか'], ['kki', 'っき'], ['kku', 'っく'], ['kke', 'っけ'], ['kko', 'っこ'],
  ['ssa', 'っさ'], ['ssi', 'っし'], ['ssu', 'っす'], ['sse', 'っせ'], ['sso', 'っそ'],
  ['ppa', 'っぱ'], ['ppi', 'っぴ'], ['ppu', 'っぷ'], ['ppe', 'っぺ'], ['ppo', 'っぽ'],
  // Combo kana
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['sho', 'しょ'],
  ['cha', 'ちゃ'], ['chi', 'ち'], ['chu', 'ちゅ'], ['cho', 'ちょ'],
  ['tsu', 'つ'],
  ['nya', 'にゃ'], ['nyi', 'にぃ'], ['nyu', 'にゅ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyi', 'ひぃ'], ['hyu', 'ひゅ'], ['hyo', 'ひょ'],
  ['mya', 'みゃ'], ['myi', 'みぃ'], ['myu', 'みゅ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryi', 'りぃ'], ['ryu', 'りゅ'], ['ryo', 'りょ'],
  ['gya', 'ぎゃ'], ['gyi', 'ぎぃ'], ['gyu', 'ぎゅ'], ['gyo', 'ぎょ'],
  ['bya', 'びゃ'], ['byi', 'びぃ'], ['byu', 'びゅ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyi', 'ぴぃ'], ['pyu', 'ぴゅ'], ['pyo', 'ぴょ'],
  ['kya', 'きゃ'], ['kyi', 'きぃ'], ['kyu', 'きゅ'], ['kyo', 'きょ'],
  ['ja', 'じゃ'], ['ji', 'じ'], ['ju', 'じゅ'], ['jo', 'じょ'],
  ['fu', 'ふ'],
  // Basic kana
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yi', 'い'], ['yu', 'ゆ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wi', 'ゐ'], ['we', 'ゑ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['nn', 'ん'], ['n\'', 'ん'], ['xn', 'ん'],
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
  ['n', 'ん'],
];

// Hiragana to Romaji mapping table
const HIRAGANA_TO_ROMAJI: [string, string][] = [
  ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'], ['し', 'shi'],
  ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'], ['ち', 'chi'],
  ['つ', 'tsu'], ['ふ', 'fu'],
  ['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'],
  ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'],
  ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'],
  ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo'],
  ['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo'],
  ['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo'],
  ['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo'],
  ['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'],
  ['じゃ', 'ja'], ['じゅ', 'ju'], ['じょ', 'jo'], ['じ', 'ji'],
  ['っか', 'kka'], ['っき', 'kki'], ['っく', 'kku'], ['っけ', 'kke'], ['っこ', 'kko'],
  ['っさ', 'ssa'], ['っし', 'sshi'], ['っす', 'ssu'], ['っせ', 'sse'], ['っそ', 'sso'],
  ['った', 'tta'], ['っち', 'cchi'], ['っつ', 'ttsu'], ['って', 'tte'], ['っと', 'tto'],
  ['っぱ', 'ppa'], ['っぴ', 'ppi'], ['っぷ', 'ppu'], ['っぺ', 'ppe'], ['っぽ', 'ppo'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'di'], ['づ', 'du'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
];

// Convert romaji string to hiragana
function romajiToHiragana(str: string): string {
  let result = str.toLowerCase();
  for (const [romaji, hiragana] of ROMAJI_TO_HIRAGANA) {
    result = result.split(romaji).join(hiragana);
  }
  return result;
}

// Convert hiragana string to romaji
function hiraganaToRomaji(str: string): string {
  let result = str;
  for (const [hiragana, romaji] of HIRAGANA_TO_ROMAJI) {
    result = result.split(hiragana).join(romaji);
  }
  return result;
}

// Check if a string contains Japanese characters
function hasJapanese(str: string): boolean {
  return /[\u3041-\u3096\u30A1-\u30F6\u4E00-\u9FFF]/.test(str);
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

// Generate all comparison forms of a string
function getAllForms(str: string): string[] {
  const base = fullWidthToHalfWidth(str).toLowerCase();
  const forms: string[] = [];

  // Form 1: Standard normalization (katakana→hiragana + cleanup)
  const hiraganaForm = normalize(str);
  if (hiraganaForm) forms.push(hiraganaForm);

  // Form 2: Romaji form (convert any Japanese to romaji)
  const asHiragana = katakanaToHiragana(removePunctuation(normalizeLongVowel(base)));
  const romajiForm = hiraganaToRomaji(asHiragana).toLowerCase();
  if (romajiForm) forms.push(removePunctuation(romajiForm));

  // Form 3: If input looks like romaji, convert to hiragana
  if (!hasJapanese(base)) {
    const fromRomaji = romajiToHiragana(removePunctuation(normalizeLongVowel(base)));
    if (fromRomaji) forms.push(fromRomaji);
    if (fromRomaji) forms.push(removeParticles(fromRomaji));
  }

  // Form 4: Without particles
  if (hiraganaForm) forms.push(removeParticles(hiraganaForm));

  // Filter empty and deduplicate
  return [...new Set(forms.filter(f => f.length > 0))];
}

export function fuzzyMatch(answer: string, correct: string): boolean {
  if (!answer || !correct) return false;

  // Quick exact match after normalization
  const normAnswer = normalize(answer);
  const normCorrect = normalize(correct);

  if (!normAnswer || !normCorrect) return false;
  if (normAnswer === normCorrect) return true;

  // Get all forms for cross-script matching
  const answerForms = getAllForms(answer);
  const correctForms = getAllForms(correct);

  // Check all combinations
  for (const af of answerForms) {
    for (const cf of correctForms) {
      if (!af || !cf) continue;

      // Exact match
      if (af === cf) return true;

      // Containment check (either direction)
      if (cf.includes(af) && af.length >= 2) return true;
      if (af.includes(cf) && cf.length >= 2) return true;

      // Levenshtein distance check (within 30% of the longer string)
      const maxLen = Math.max(af.length, cf.length);
      const threshold = Math.ceil(maxLen * 0.3);
      const dist = distance(af, cf);
      if (dist <= threshold) return true;
    }
  }

  return false;
}
