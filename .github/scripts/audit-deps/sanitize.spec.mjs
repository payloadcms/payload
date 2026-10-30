import { describe, expect, it } from 'vitest'

import {
  closeOpenFence,
  escapeTableCell,
  neutralizeIssueRefs,
  sanitizeOutsideText,
  stripHtmlComments,
} from './sanitize.mjs'

describe('sanitizeOutsideText', () => {
  const clean = (text, maxLength = 1000) => sanitizeOutsideText({ text, maxLength })

  it('should remove an HTML comment', () => {
    expect(clean('a <!-- x --> b')).toBe('a  b')
  })

  it('should remove an unterminated comment opener', () => {
    expect(clean('x <!-- never closed')).not.toContain('<!--')
  })

  it('should remove nested comment forms', () => {
    const result = clean('<!<!-- -->-- hi -->')

    expect(result).not.toContain('<!--')
    expect(result).not.toContain('-->')
  })

  it('should break mentions with a zero-width space', () => {
    expect(clean('thanks @dotansimha')).toBe('thanks @​dotansimha')
  })

  it('should leave emails unchanged', () => {
    expect(clean('a@b.c')).toBe('a@b.c')
  })

  it('should neutralize details and summary tags', () => {
    expect(clean('x </details> <summary>')).not.toMatch(/<\/?(details|summary)/)
  })

  it('should cut at maxLength with an ellipsis', () => {
    const result = clean('abcdefghij', 5)

    expect(result).toBe('abcd…')
  })

  it('should neutralize issue refs and github links', () => {
    expect(clean('fix #12 https://github.com/a/b/issues/1')).toBe(
      'fix #​12 https://redirect.github.com/a/b/issues/1',
    )
  })

  it('should keep the result within maxLength after neutralizing', () => {
    expect(clean('#1 #2 #3 #4 #5 #6', 8).length).toBeLessThanOrEqual(8)
  })
})

describe('neutralizeIssueRefs', () => {
  it('should break refs and redirect github links', () => {
    expect(neutralizeIssueRefs({ text: '#1 a/b#2 https://github.com/x' })).toBe(
      '#​1 a/b#​2 https://redirect.github.com/x',
    )
  })

  it('should rewrite mixed-case and www hosts', () => {
    const text = 'https://www.github.com/a HTTPS://GitHub.com/b https://GITHUB.COM/c'

    expect(neutralizeIssueRefs({ text })).toBe(
      'https://redirect.github.com/a https://redirect.github.com/b https://redirect.github.com/c',
    )
  })
})

describe('closeOpenFence', () => {
  it('should close with the same character and length', () => {
    expect(closeOpenFence({ text: '````\na\n```' })).toBe('````\na\n```\n````')
  })

  it('should leave balanced fences alone', () => {
    expect(closeOpenFence({ text: '~~~\na\n~~~' })).toBe('~~~\na\n~~~')
  })
})

describe('escapeTableCell', () => {
  it('should escape pipes and flatten newlines', () => {
    expect(escapeTableCell({ text: 'a|b\nc' })).toBe('a\\|b c')
  })
})

describe('stripHtmlComments', () => {
  it('should be exported for the codex contract', () => {
    expect(stripHtmlComments({ text: 'a<!-- b -->c' })).toBe('ac')
  })
})
