import { generateText, Output } from 'ai'

import type { RunEvalOptions, RunnerResult } from '../types.js'

import { DEFAULT_RUNNER_MODEL } from '../models.js'
import { AnswerSchema } from '../schemas.js'
import { SYSTEM_PROMPTS } from './systemPrompts.js'

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
