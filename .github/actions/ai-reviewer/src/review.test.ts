import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import { readSystemPrompt } from './review'

vi.mock('fs')
const mockFs = vi.mocked(fs)

describe('readSystemPrompt', () => {
  beforeEach(() => {
    process.env.GITHUB_WORKSPACE = '/workspace'
  })

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE
    vi.resetAllMocks()
  })

  it('should return the contents of the prompt file', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue('You are a helpful code reviewer.')

    const result = readSystemPrompt('.github/ai-reviewer-prompt.md')

    expect(result).toBe('You are a helpful code reviewer.')
  })

  it('should throw when the prompt file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)

    expect(() => readSystemPrompt('.github/ai-reviewer-prompt.md')).toThrow(
      'Reviewer prompt file not found: .github/ai-reviewer-prompt.md',
    )
  })
})
