import { describe, expect, it } from 'vitest'

import { slugify } from './slugify.js'

/**
 * Inputs for the invariant suite at the bottom: every literal asserted in this
 * file, plus a few extra adversarial inputs. When you add a case to any block
 * above, add its input here too.
 */
const allInputs: string[] = [
  '',
  '   ',
  'Hello World!',
  '  Trimmed  ',
  'snake_case stays',
  '你好世界',
  '正念餅乾',
  '안녕하세요',
  'Привет мир',
  'Γειά σου Κόσμε',
  'مرحبا بالعالم',
  'שלום עולם',
  'สวัสดีชาวโลก',
  'नमस्ते दुनिया',
  'Café Pläne',
  'Fahrplan Zukunft Pläne',
  'Điện Biên Phủ',
  'ＡＢＣ１２３',
  '½',
  'Ⅻ',
  '㍿',
  'a  b',
  'a—b',
  'a–b',
  'a--b',
  '-abc-',
  'a---b',
  'a\tb',
  'a-',
  'a\u2011b',
  'a\u2212b',
  'a\u2053b',
  'a\u2043b',
  'a\u00ADb',
  'a\u207Bb',
  'a\u301Cb',
  'a\u00A0b',
  '!!!',
  '-',
  '___',
  '-_-',
  '\u0301',
  '👍',
  '❤️',
  '👨‍👩‍👧',
  'a❤️b',
  'a!\u0301b',
  '1️⃣',
  '\u0301abc',
  'İstanbul',
  'อุ',
  'a\u200cb',
  'a\u200db',
  'אבג\u202etxt',
  'a\uFE0Fb',
  'a\u034Fb',
  '\u3164',
  '\uFFA0',
  'a\u3164b',
  'H\u0331',
  '\u1E96',
  'J\u030C',
  '\u01F0',
  'T\u0308',
  '\u1E97',
  '\u1100!\u1161',
  'a\u202e\u0301b',
  'a\u200c\u0301b',
  'a\ufe0f\u0301b',
  'a\u034f\u0301b',
  'a\u3164\u0301b',
  '\u00e1b',
  '¼',
  '⅒',
  '↉',
  '⑿',
  '㊿',
  '№',
  '༳',
  '௰',
]

describe('slugify', () => {
  it('should handle empty input', () => {
    expect(slugify(undefined)).toBeUndefined()
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
  })

  it('should slugify ASCII text', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
    expect(slugify('  Trimmed  ')).toBe('trimmed')
    expect(slugify('snake_case stays')).toBe('snake_case-stays')
  })

  it('should preserve non-Latin scripts', () => {
    expect(slugify('你好世界')).toBe('你好世界')
    expect(slugify('正念餅乾')).toBe('正念餅乾')
    expect(slugify('안녕하세요')).toBe('안녕하세요')
    expect(slugify('Привет мир')).toBe('привет-мир')
    expect(slugify('Γειά σου Κόσμε')).toBe('γειά-σου-κόσμε')
    expect(slugify('مرحبا بالعالم')).toBe('مرحبا-بالعالم')
    expect(slugify('שלום עולם')).toBe('שלום-עולם')
    expect(slugify('สวัสดีชาวโลก')).toBe('สวัสดีชาวโลก')
    expect(slugify('नमस्ते दुनिया')).toBe('नमस्ते-दुनिया')
  })

  it('should preserve accented Latin', () => {
    expect(slugify('Café Pläne')).toBe('café-pläne')
    expect(slugify('Fahrplan Zukunft Pläne')).toBe('fahrplan-zukunft-pläne')
    expect(slugify('Điện Biên Phủ')).toBe('điện-biên-phủ')
  })

  it('should fold compatibility forms via NFKC', () => {
    expect(slugify('ＡＢＣ１２３')).toBe('abc123')
    expect(slugify('½')).toBe('12')
    expect(slugify('Ⅻ')).toBe('xii')
    expect(slugify('㍿')).toBe('株式会社')
  })

  it('should collapse whitespace and dash punctuation to single hyphens', () => {
    expect(slugify('a  b')).toBe('a-b')
    expect(slugify('a—b')).toBe('a-b') // em dash
    expect(slugify('a–b')).toBe('a-b') // en dash
    expect(slugify('a--b')).toBe('a-b')
    expect(slugify('-abc-')).toBe('abc')
    expect(slugify('a---b')).toBe('a-b')
  })

  it('should treat the full Unicode Dash set, plus the hyphen bullet, as separators', () => {
    expect(slugify('a\u2011b')).toBe('a-b') // non-breaking hyphen
    expect(slugify('a\u2212b')).toBe('a-b') // minus sign — Dash but not Dash_Punctuation
    expect(slugify('a\u2053b')).toBe('a-b') // swung dash — Dash but not Dash_Punctuation
    expect(slugify('a\u2043b')).toBe('a-b') // hyphen bullet — explicit addition, in neither set
    expect(slugify('a\u207Bb')).toBe('a-b') // superscript minus, folds to U+2212 under NFKC
    expect(slugify('a\u301Cb')).toBe('a-b') // wave dash
    expect(slugify('a\u00A0b')).toBe('a-b') // NBSP is \s — separated, no longer joined
  })

  it('should delete the soft hyphen rather than turn it into a separator', () => {
    // U+00AD marks a permitted line-break point inside a word; the word is one word.
    expect(slugify('a\u00ADb')).toBe('ab')
  })

  it('should return the empty string when no letter or number remains', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('-')).toBe('')
    expect(slugify('___')).toBe('')
    expect(slugify('-_-')).toBe('')
    expect(slugify('\u0301')).toBe('') // lone combining acute
    expect(slugify('👍')).toBe('')
    expect(slugify('❤️')).toBe('') // heart + variation selector
    expect(slugify('👨‍👩‍👧')).toBe('') // ZWJ family sequence
    expect(slugify('\u3164')).toBe('') // Hangul filler — an invisible \p{L}, must not satisfy the guard
    expect(slugify('\uFFA0')).toBe('') // halfwidth Hangul filler, same
  })

  it('should not let removed characters re-attach their combining marks', () => {
    expect(slugify('a❤️b')).toBe('ab')
    expect(slugify('a!\u0301b')).toBe('ab')
  })

  it('should strip marks that do not follow a letter', () => {
    expect(slugify('1️⃣')).toBe('1') // keycap: digit + VS16 + combining enclosing keycap
    expect(slugify('\u0301abc')).toBe('abc')
  })

  it('should keep marks that follow a letter', () => {
    expect(slugify('İstanbul')).toBe('i\u0307stanbul')
    expect(slugify('อุ')).toBe('อุ') // Thai letter + vowel mark below
  })

  it('should strip ZWJ, ZWNJ, and bidi controls', () => {
    expect(slugify('a\u200cb')).toBe('ab') // ZWNJ
    expect(slugify('a\u200db')).toBe('ab') // ZWJ
    expect(slugify('אבג\u202etxt')).toBe('אבגtxt') // RLO
  })

  it('should strip default-ignorable code points that hide between visible characters', () => {
    expect(slugify('a\uFE0Fb')).toBe('ab') // variation selector 16
    expect(slugify('a\u034Fb')).toBe('ab') // combining grapheme joiner
    expect(slugify('a\u3164b')).toBe('ab') // Hangul filler mid-word
  })

  it('should not let a deleted invisible character re-attach its combining marks', () => {
    // The default-ignorable strip has to run after the disallowed-character pass
    // and carry the same trailing \p{M}*. Otherwise deleting the invisible exposes
    // its marks to the preceding letter, and NFKC composes them: every case here
    // would become 'áb' and collide with a genuine 'áb'.
    expect(slugify('a‮́b')).toBe('ab') // RLO — grapheme-breaking, mark was never on the 'a'
    expect(slugify('a‌́b')).toBe('ab') // ZWNJ
    expect(slugify('a️́b')).toBe('ab') // variation selector 16
    expect(slugify('a͏́b')).toBe('ab') // combining grapheme joiner
    expect(slugify('aㅤ́b')).toBe('ab') // Hangul filler
    expect(slugify('áb')).toBe('áb') // the genuine title the above must not collide with
  })

  it('should produce byte-identical, NFKC-normalized output for canonically equivalent inputs', () => {
    // Lowercasing a composed capital can only be expressed decomposed; without a
    // trailing normalize these pairs would be canonically equal but byte-distinct,
    // and exact-string uniqueness checks would treat them as different slugs.
    expect(slugify('H\u0331')).toBe('\u1E96') // ẖ, single code point
    expect(slugify('H\u0331')).toBe(slugify('\u1E96'))
    expect(slugify('J\u030C')).toBe('\u01F0') // ǰ
    expect(slugify('J\u030C')).toBe(slugify('\u01F0'))
    expect(slugify('T\u0308')).toBe('\u1E97') // ẗ
    expect(slugify('T\u0308')).toBe(slugify('\u1E97'))
  })

  it('should renormalize after deletions expose composable sequences', () => {
    // Deleting the '!' makes the two jamo adjacent; NFKC composes them into a
    // syllable. If normalization ran before the deletions instead of after,
    // the output would not be a fixed point and autosave would rewrite it.
    expect(slugify('\u1100!\u1161')).toBe('\uAC00')
  })

  it('should be a fixed point: slugify(slugify(x)) === slugify(x)', () => {
    // Autosave resends the stored slug on every tick and it is re-slugified.
    // Any input whose slug is not a fixed point gets silently rewritten.
    for (const input of allInputs) {
      const once = slugify(input)
      expect(slugify(once)).toBe(once)
    }
  })

  it('should be invariant under the normalization form of the input', () => {
    // The same visible title typed on macOS (NFD-ish) and Windows (NFC-ish)
    // must produce the same slug.
    for (const input of allInputs) {
      const out = slugify(input)
      expect(slugify(input.normalize('NFD'))).toBe(out)
      expect(slugify(input.normalize('NFC'))).toBe(out)
    }
  })
})
