import { generateText, Output } from 'ai'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

import type { RunEvalOptions, RunnerResult, SystemPromptKey } from './types.js'

import { DEFAULT_RUNNER_MODEL } from './models.js'

export type { RunEvalOptions, RunnerResult, SystemPromptKey }

dotenv.config()

const claudeMdPath = path.resolve(process.cwd(), 'CLAUDE.md')
const CLAUDE_MD_CONTEXT = fs.readFileSync(claudeMdPath, 'utf-8')

export const SYSTEM_PROMPTS = {
  /**
   * For Q&A evals about Payload's contributor conventions (coding style, commits, tests, etc.)
   * Uses CLAUDE.md as the primary reference.
   */
  qa: `You are an expert on the Payload CMS codebase and its development conventions.
Answer questions accurately and concisely based on the following guidance document:

${CLAUDE_MD_CONTEXT}`,

  /**
   * For code generation evals: producing valid Payload collection, field, and config TypeScript.
   * Uses the model's Payload knowledge; respond with clean TypeScript snippets only.
   */
  codegen: `You are an expert Payload CMS developer.
When asked to write Payload code, produce clean, correct TypeScript using Payload's API.
Key rules:
- Collections use CollectionConfig type from "payload"
- Fields are objects in a "fields" array with a "type" string and "name" string
- Common field types: text, textarea, number, checkbox, select, relationship, richText, array, group, blocks, date, email, upload
- Access control functions receive ({ req }) and return a boolean or Promise<boolean>
- Hooks are arrays of async functions inside a "hooks" object (e.g. hooks.beforeChange, hooks.afterRead)
- Config options live at the top level of buildConfig({ ... })
- Plugins are functions added to the "plugins" array
- Localization is configured with a "localization" key containing locales, defaultLocale, and fallback
Respond with a TypeScript code snippet. Be concise — no prose, just the code.`,
}

const AnswerSchema = z.object({
  answer: z.string().describe('The answer or generated code'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (unsure) to 1 (certain)'),
})

export async function runEval(
  question: string,
  options: RunEvalOptions = {},
): Promise<RunnerResult> {
  const { model = DEFAULT_RUNNER_MODEL, systemPromptKey = 'qa' } = options

  const { output } = await generateText({
    model,
    output: Output.object({ schema: AnswerSchema }),
    system: SYSTEM_PROMPTS[systemPromptKey],
    prompt: question,
  })

  return output
}
