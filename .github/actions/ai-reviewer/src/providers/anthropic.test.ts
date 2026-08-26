import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAnthropicProvider } from './anthropic'
import type { AIProvider } from './types'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))

import Anthropic from '@anthropic-ai/sdk'

describe('createAnthropicProvider', () => {
  let mockCreate: ReturnType<typeof vi.fn>
  let provider: AIProvider

  beforeEach(() => {
    mockCreate = vi.fn()
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: mockCreate },
    }))
    provider = createAnthropicProvider('test-api-key', 'claude-sonnet-4-6')
  })

  it('should return a ReviewResult parsed from the tool_use block', async () => {
    const expectedResult = {
      summary: 'Looks good overall.',
      comments: [{ path: 'src/index.ts', line: 10, body: 'Consider extracting this.' }],
    }

    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'submit_review', input: expectedResult }],
    })

    const result = await provider.review({
      systemPrompt: 'You are a code reviewer.',
      diff: 'diff --git a/src/index.ts b/src/index.ts',
    })

    expect(result).toEqual(expectedResult)
  })

  it('should throw when the AI response contains no tool_use block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Here is my review...' }],
    })

    await expect(
      provider.review({ systemPrompt: 'You are a code reviewer.', diff: 'diff --git...' }),
    ).rejects.toThrow('AI did not return a structured review')
  })

  it('should pass the system prompt and diff to the API', async () => {
    mockCreate.mockResolvedValue({
      content: [
        { type: 'tool_use', name: 'submit_review', input: { summary: 'ok', comments: [] } },
      ],
    })

    await provider.review({ systemPrompt: 'My system prompt', diff: 'my diff' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: [expect.objectContaining({ text: 'My system prompt' })],
        messages: [expect.objectContaining({ content: expect.stringContaining('my diff') })],
      }),
    )
  })
})
