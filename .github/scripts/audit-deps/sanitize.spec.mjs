import { describe, expect, it } from 'vitest'

import { closeOpenFence, neutralizeIssueRefs, sanitizeOutsideText } from './sanitize.mjs'

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
    ['@@octocat', `@@${ZERO_WIDTH_SPACE}octocat`],
    ['a@b.c', 'a@b.c'],
  ])('should break mentions in %s and leave emails unchanged', (text, expected) => {
    expect(clean(text)).toBe(expected)
  })

  it('should neutralize details and summary tags', () => {
    expect(clean('x </details> <summary>')).not.toMatch(/<\/?(details|summary)/)
  })
})

describe('neutralizeIssueRefs', () => {
  const redirect = 'https://redirect.github.com'

  it.each([
    ['https://www.github.com/a HTTPS://GitHub.com/b', `${redirect}/a ${redirect}/b`],
    ['http://github.com/a', `${redirect}/a`],
    ['[x](//github.com/a)', `[x](${redirect}/a)`],
    ['see WWW.GITHUB.COM/b', `see ${redirect}/b`],
  ])('should neutralize %s', (text, expected) => {
    expect(neutralizeIssueRefs({ text })).toBe(expected)
  })
})

describe('closeOpenFence', () => {
  it('should close only an open fence, with the same character and length', () => {
    expect(closeOpenFence({ text: '````\na\n```' })).toBe('````\na\n```\n````')
    expect(closeOpenFence({ text: '~~~\na\n~~~' })).toBe('~~~\na\n~~~')
  })
})
