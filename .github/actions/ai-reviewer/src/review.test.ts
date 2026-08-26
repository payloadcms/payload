import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import { buildSystemPrompt, mergeReviewResults } from './review'
import type { ReviewResult } from './providers/types'

vi.mock('fs')
const mockFs = vi.mocked(fs)

describe('mergeReviewResults', () => {
  it('should return empty summary and comments for an empty array', () => {
    const result = mergeReviewResults([])

    expect(result.summary).toBe('')
    expect(result.comments).toEqual([])
  })

  it('should pass through a single result unchanged', () => {
    const single: ReviewResult = {
      summary: 'Looks good.',
      comments: [{ path: 'src/a.ts', line: 1, body: 'Nice.' }],
    }

    const result = mergeReviewResults([single])

    expect(result).toEqual(single)
  })

  it('should concatenate comments from multiple results', () => {
    const results: ReviewResult[] = [
      { summary: 'File A ok.', comments: [{ path: 'src/a.ts', line: 1, body: 'A comment' }] },
      {
        summary: 'File B has issues.',
        comments: [{ path: 'src/b.ts', line: 5, body: 'B comment' }],
      },
    ]

    const merged = mergeReviewResults(results)

    expect(merged.comments).toHaveLength(2)
    expect(merged.comments[0].path).toBe('src/a.ts')
    expect(merged.comments[1].path).toBe('src/b.ts')
  })

  it('should combine summaries as markdown separated by dividers', () => {
    const results: ReviewResult[] = [
      { summary: 'File A ok.', comments: [] },
      { summary: 'File B has issues.', comments: [] },
    ]

    const merged = mergeReviewResults(results)

    expect(merged.summary).toContain('File A ok.')
    expect(merged.summary).toContain('File B has issues.')
  })
})

describe('buildSystemPrompt', () => {
  beforeEach(() => {
    process.env.GITHUB_WORKSPACE = '/workspace'
  })

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE
    vi.resetAllMocks()
  })

  it('should return just the prompt when no CLAUDE.md exists and not a fork', () => {
    mockFs.existsSync.mockImplementation((p) => p === '/workspace/.github/ai-reviewer-prompt.md')
    mockFs.readFileSync.mockReturnValue('You are a reviewer.')

    const result = buildSystemPrompt('.github/ai-reviewer-prompt.md', false)

    expect(result).toBe('You are a reviewer.')
  })

  it('should append the injection notice when PR is from a fork', () => {
    mockFs.existsSync.mockImplementation((p) => p === '/workspace/.github/ai-reviewer-prompt.md')
    mockFs.readFileSync.mockReturnValue('You are a reviewer.')

    const result = buildSystemPrompt('.github/ai-reviewer-prompt.md', true)

    expect(result).toContain('You are a reviewer.')
    expect(result).toContain('Security Notice')
    expect(result.indexOf('You are a reviewer.')).toBeLessThan(result.indexOf('Security Notice'))
  })

  it('should prepend CLAUDE.md content when it exists', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockImplementation((p) => {
      if (String(p).endsWith('CLAUDE.md')) return '# Project guidelines'
      return 'You are a reviewer.'
    })

    const result = buildSystemPrompt('.github/ai-reviewer-prompt.md')

    expect(result).toContain('# Project guidelines')
    expect(result).toContain('You are a reviewer.')
    expect(result.indexOf('# Project guidelines')).toBeLessThan(
      result.indexOf('You are a reviewer.'),
    )
  })

  it('should throw when the prompt file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)

    expect(() => buildSystemPrompt('.github/ai-reviewer-prompt.md')).toThrow(
      'Reviewer prompt file not found: .github/ai-reviewer-prompt.md',
    )
  })
})
