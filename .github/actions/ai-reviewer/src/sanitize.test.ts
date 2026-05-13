import { describe, expect, it } from 'vitest'
import { capComments, filterCommentsToChangedFiles, sanitizeMarkdown } from './sanitize'

describe('sanitizeMarkdown', () => {
  it('should defang @ mentions by inserting zero-width space', () => {
    const result = sanitizeMarkdown('Hello @user and @org/team')
    expect(result).toBe('Hello @​user and @​org/team')
  })

  it('should truncate text exceeding maxLength', () => {
    const long = 'a'.repeat(3000)
    const result = sanitizeMarkdown(long, 2000)
    expect(result).toHaveLength(2000)
  })

  it('should apply both defanging and truncation', () => {
    const input = '@user ' + 'x'.repeat(2000)
    const result = sanitizeMarkdown(input, 100)
    expect(result).toHaveLength(100)
    expect(result.startsWith('@​user')).toBe(true)
  })

  it('should not modify text without @ or exceeding length', () => {
    const result = sanitizeMarkdown('clean text', 2000)
    expect(result).toBe('clean text')
  })
})

describe('capComments', () => {
  it('should return all comments when under the cap', () => {
    const comments = Array.from({ length: 5 }, (_, i) => ({
      path: `file${i}.ts`,
      line: i + 1,
      body: 'comment',
    }))
    expect(capComments(comments, 20)).toHaveLength(5)
  })

  it('should truncate to the cap when over', () => {
    const comments = Array.from({ length: 25 }, (_, i) => ({
      path: `file${i}.ts`,
      line: i + 1,
      body: 'comment',
    }))
    expect(capComments(comments, 20)).toHaveLength(20)
  })
})

describe('filterCommentsToChangedFiles', () => {
  const changedPaths = new Set(['src/foo.ts', 'src/bar.ts'])

  it('should keep comments whose path is in the changed files set', () => {
    const comments = [
      { path: 'src/foo.ts', line: 1, body: 'ok' },
      { path: 'src/bar.ts', line: 5, body: 'also ok' },
    ]
    expect(filterCommentsToChangedFiles(comments, changedPaths)).toHaveLength(2)
  })

  it('should remove comments with paths not in the changed files set', () => {
    const comments = [
      { path: 'src/foo.ts', line: 1, body: 'ok' },
      { path: 'src/hallucinated.ts', line: 1, body: 'bad' },
    ]
    const result = filterCommentsToChangedFiles(comments, changedPaths)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('src/foo.ts')
  })

  it('should return empty array when no comments match', () => {
    const comments = [{ path: 'totally/fake.ts', line: 1, body: 'bad' }]
    expect(filterCommentsToChangedFiles(comments, changedPaths)).toHaveLength(0)
  })
})
