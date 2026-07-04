export const MORSE_DATA = {
  thaiConsonants: [
    { char: 'ก', morse: '− − ·' }, { char: 'ข', morse: '− · · − ·' }, { char: 'ค', morse: '− · − ·' },
    { char: 'ง', morse: '− · − · −' }, { char: 'จ', morse: '· − · · ·' }, { char: 'ฉ', morse: '− − − ·' },
    { char: 'ช', morse: '− − · −' }, { char: 'ซ', morse: '· · · −' }, { char: 'ญ', morse: '· − − −' },
    { char: 'ด', morse: '− · ·' }, { char: 'ต', morse: '−' }, { char: 'ถ', morse: '− − · · −' },
    { char: 'ท', morse: '− − −' }, { char: 'ธ', morse: '− · − − ·' }, { char: 'น', morse: '− ·' },
    { char: 'บ', morse: '− · · −' }, { char: 'ป', morse: '· − − · −' }, { char: 'ผ', morse: '· · − −' },
    { char: 'พ', morse: '· − − ·' }, { char: 'ฟ', morse: '· · − · −' }, { char: 'ภ', morse: '− − · −' },
    { char: 'ม', morse: '− −' }, { char: 'ย', morse: '· − · −' }, { char: 'ร', morse: '· − ·' },
    { char: 'ล', morse: '· − · ·' }, { char: 'ว', morse: '· − −' }, { char: 'ศ', morse: '· · · −' },
    { char: 'ษ', morse: '· · · −' }, { char: 'ส', morse: '· · ·' }, { char: 'ห', morse: '· · · ·' },
    { char: 'ฬ', morse: '· − −' }, { char: 'อ', morse: '−' }, { char: 'ฮ', morse: '· · · ·' },
    { char: 'ฆ', morse: '− − · ·' }, { char: 'ฑ', morse: '− · · · −' }
  ],
  thaiVowelsAndTones: [
    { char: 'ะ', morse: '·' }, { char: 'า', morse: '· −' }, { char: 'ิ', morse: '· · − ·' },
    { char: 'ี', morse: '· · ·' }, { char: 'ึ', morse: '· · − ·' }, { char: 'ู', morse: '· · −' },
    { char: 'เ', morse: '· −' }, { char: 'แ', morse: '· − · ·' }, { char: 'โ', morse: '− − −' },
    { char: 'ใ', morse: '· − − −' }, { char: 'ไ', morse: '· · · −' }, { char: 'ๅ', morse: '− · ·' },
    { char: 'ั', morse: '− · · −' }, { char: '์', morse: '· − − ·' }, { char: '่', morse: '· − · ·' },
    { char: '้', morse: '− − · −' }, { char: '๊', morse: '− · − ·' }, { char: '๋', morse: '· · · ·' }
  ],
  englishUpper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char, index) => ({
    char,
    morse: ['· −','− · · ·','− · − ·','− · ·','·','· · − ·','− − ·','· · · ·','· ·','· − − −','− · −','· − · ·','− −','− ·','− − −','· − − ·','− − · −','· − ·','· · ·','−','· · −','· · · −','· − −','− · · −','− · − −','− − · ·'][index]
  })),
  englishLower: 'abcdefghijklmnopqrstuvwxyz'.split('').map((char, index) => ({
    char,
    morse: ['· −','− · · ·','− · − ·','− · ·','·','· · − ·','− − ·','· · · ·','· ·','· − − −','− · −','· − · ·','− −','− ·','− − −','· − − ·','− − · −','· − ·','· · ·','−','· · −','· · · −','· − −','− · · −','− · − −','− − · ·'][index]
  }))
};
const lookup = Object.values(MORSE_DATA).flat().reduce((map, item) => map.set(item.char, item.morse), new Map());
export function getMorseForCharacter(character) { return lookup.get(character) || ''; }
