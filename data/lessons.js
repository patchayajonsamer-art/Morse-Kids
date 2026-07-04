import { MORSE_DATA } from './morseData.js';
const thaiConsonantCharacters = MORSE_DATA.thaiConsonants.map((item) => item.char);
const thaiVowelCharacters = MORSE_DATA.thaiVowelsAndTones.map((item) => item.char);
const upperCharacters = MORSE_DATA.englishUpper.map((item) => item.char);
const lowerCharacters = MORSE_DATA.englishLower.map((item) => item.char);
function chunkCharacters(characters, sizes) {
  const output = []; let index = 0;
  sizes.forEach((size) => { output.push(characters.slice(index, index + size)); index += size; });
  return output;
}
const thaiConsonantChunks = chunkCharacters(thaiConsonantCharacters, [5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0]);
const thaiVowelChunks = chunkCharacters(thaiVowelCharacters, [5, 5, 5, 3, 0]);
const englishUpperChunks = chunkCharacters(upperCharacters, [9, 9, 8]);
const englishLowerChunks = chunkCharacters(lowerCharacters, [9, 9, 8]);
function seededShuffle(characters, seedText) {
  let seed = [...seedText].reduce((value, char) => value + char.charCodeAt(0), 0) || 1;
  const copy = [...characters];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((seed / 233280) * (i + 1));
    [copy[i], copy[swapIndex]] = [copy[swapIndex], copy[i]];
  }
  return copy;
}
export const LESSONS = [
  ...thaiConsonantChunks.map((newCharacters, index) => ({ id: index + 1, group: 'thai', title: `ด่านที่ ${index + 1}`, subtitle: index < 7 ? 'พยัญชนะไทย' : 'ทบทวนพยัญชนะไทย', newCharacters })),
  ...thaiVowelChunks.map((newCharacters, index) => ({ id: index + 13, group: 'thai', title: `ด่านที่ ${index + 13}`, subtitle: 'สระและวรรณยุกต์ไทย', newCharacters })),
  ...englishUpperChunks.map((newCharacters, index) => ({ id: index + 18, group: 'english', title: `ด่านที่ ${index + 18}`, subtitle: 'ภาษาอังกฤษตัวพิมพ์ใหญ่', newCharacters })),
  ...englishLowerChunks.map((newCharacters, index) => ({ id: index + 21, group: 'english', title: `ด่านที่ ${index + 21}`, subtitle: 'ภาษาอังกฤษตัวพิมพ์เล็ก', newCharacters }))
];
export function getLessonById(lessonId) { return LESSONS.find((lesson) => lesson.id === Number(lessonId)); }
export function buildLessonCharacters(lessonId, seedText = 'morse-kids') {
  const lesson = getLessonById(lessonId); if (!lesson) return []; if (lesson.id === 1) return lesson.newCharacters;
  const previous = LESSONS.filter((item) => item.id < lesson.id && item.group === lesson.group).flatMap((item) => item.newCharacters);
  const reviewCount = Math.max(0, 8 - lesson.newCharacters.length);
  const reviewCharacters = seededShuffle(previous.filter((char) => !lesson.newCharacters.includes(char)), `${seedText}-${lesson.id}`).slice(0, reviewCount);
  return [...lesson.newCharacters, ...reviewCharacters];
}
