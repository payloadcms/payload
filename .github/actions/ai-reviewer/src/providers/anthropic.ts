import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ReviewResult } from './types'

const reviewTool: Anthropic.Tool = {
  name: 'submit_review',
  description: 'Submit the structured code review result',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description: 'Overall review summary in markdown',
      },
      comments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to repo root' },
            line: { type: 'integer', description: 'Line number in the new version of the file' },
            body: { type: 'string', description: 'Review comment in markdown' },
          },
          required: ['path', 'line', 'body'],
        },
      },
    },
    required: ['summary', 'comments'],
  },
}

export function createAnthropicProvider(apiKey: string, model: string): AIProvider {
  const client = new Anthropic({ apiKey })

  return {
    async review({
      systemPrompt,
      diff,
    }: {
      systemPrompt: string
      diff: string
    }): Promise<ReviewResult> {
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: [
          {
            type: 'text' as const,
            text: systemPrompt,
            cache_control: { type: 'ephemeral' as const },
          },
        ],
        tools: [reviewTool],
        tool_choice: { type: 'tool' as const, name: 'submit_review' },
        messages: [
          {
            role: 'user',
            content: `Please review the following pull request diff:\n\n\`\`\`diff\n${diff}\n\`\`\``,
          },
        ],
      })

      const toolUse = response.content.find((block) => block.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new Error('AI did not return a structured review')
      }

      return toolUse.input as ReviewResult
    },
  }
}
