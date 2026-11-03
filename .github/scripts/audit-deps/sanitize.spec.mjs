import { describe, expect, it } from 'vitest'

import {
  closeOpenFence,
  escapeTableCell,
  neutralizeIssueRefs,
  sanitizeOutsideText,
} from './sanitize.mjs'

const ZERO_WIDTH_SPACE = '​'

describe('sanitizeOutsideText', () => {
  const clean = (text, maxLength = 1000) => sanitizeOutsideText({ text, maxLength })

  it.each(['a <!-- x --> b', 'x <!-- never closed', '<!<!-- -->-- hi -->'])(
    'should remove every comment form from %s',
    (text) => {
      const result = clean(text)

      expect(result).not.toContain('<!--')
      expect(result).not.toContain('-->')
    },
  )

  it.each([
    ['thanks @dotansimha', `thanks @${ZERO_WIDTH_SPACE}dotansimha`],
    ['@@octocat', `@@${ZERO_WIDTH_SPACE}octocat`],
    ['x@@name', `x@@${ZERO_WIDTH_SPACE}name`],
    ['a@b.c', 'a@b.c'],
  ])('should break mentions in %s and leave emails unchanged', (text, expected) => {
    expect(clean(text)).toBe(expected)
  })

  it('should neutralize details and summary tags', () => {
    expect(clean('x </details> <summary>')).not.toMatch(/<\/?(details|summary)/)
  })

  it('should keep the result within maxLength after neutralizing', () => {
    expect(clean('#1 #2 #3 #4 #5 #6', 8).length).toBeLessThanOrEqual(8)
  })
})

describe('neutralizeIssueRefs', () => {
  const redirect = 'https://redirect.github.com'

  it.each([
    ['#1 a/b#2', `#${ZERO_WIDTH_SPACE}1 a/b#${ZERO_WIDTH_SPACE}2`],
    ['https://www.github.com/a HTTPS://GitHub.com/b', `${redirect}/a ${redirect}/b`],
    ['http://github.com/a', `${redirect}/a`],
    ['[x](//github.com/a)', `[x](${redirect}/a)`],
    ['see WWW.GITHUB.COM/b', `see ${redirect}/b`],
  ])('should neutralize %s', (text, expected) => {
    expect(neutralizeIssueRefs({ text })).toBe(expected)
  })
})

describe('markdown containment', () => {
  it('should close an open fence with the same character and length', () => {
    expect(closeOpenFence({ text: '````\na\n```' })).toBe('````\na\n```\n````')
  })

  it('should leave balanced fences alone', () => {
    expect(closeOpenFence({ text: '~~~\na\n~~~' })).toBe('~~~\na\n~~~')
  })

  it('should escape pipes and flatten newlines in a table cell', () => {
    expect(escapeTableCell({ text: 'a|b\nc' })).toBe('a\\|b c')
  })
})
