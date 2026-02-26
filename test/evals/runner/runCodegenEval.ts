import { generateText, Output } from 'ai'

import type { CodegenRunnerResult, RunCodegenEvalOptions } from '../types.js'

import { DEFAULT_RUNNER_MODEL } from '../models.js'
import { ModifiedConfigSchema } from '../schemas.js'
import { SYSTEM_PROMPTS } from './systemPrompts.js'

export async function runCodegenEval(
  instruction: string,
  starterConfig: string,
  options: RunCodegenEvalOptions = {},
): Promise<CodegenRunnerResult> {
  const { model = DEFAULT_RUNNER_MODEL, systemPromptKey = 'qaWithSkill' } = options
  const system =
    systemPromptKey === 'qaNoSkill'
      ? SYSTEM_PROMPTS.codegenNoSkill
      : SYSTEM_PROMPTS.codegenWithSkill

  const { output, usage } = await generateText({
    model,
    output: Output.object({ schema: ModifiedConfigSchema }),
    system,
    prompt: `Task: ${instruction}

Starter payload.config.ts:
${starterConfig}`,
  })

  return { ...output, usage }
}
