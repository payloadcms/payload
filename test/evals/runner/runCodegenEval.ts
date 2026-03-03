import type { z } from 'zod'

import { generateText, Output } from 'ai'

import type { CodegenRunnerResult, RunCodegenEvalOptions } from '../types.js'

import { DEFAULT_RUNNER_MODEL } from '../models.js'
import { ModifiedConfigSchema } from '../schemas.js'
import { SYSTEM_PROMPTS } from './systemPrompts.js'

type ModifiedConfig = z.infer<typeof ModifiedConfigSchema>

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

  // `Output.object` + `generateText` generics recurse too deeply over the Zod schema tree.
  // Casting to `unknown` stops the inference chain; `output` is then re-typed explicitly below.
  const { output, usage } = await generateText({
    model,
    output: Output.object({ schema: ModifiedConfigSchema }) as unknown as Output<ModifiedConfig>,
    system,
    prompt: `Task: ${instruction}

Starter payload.config.ts:
${starterConfig}`,
  })

  return { ...(output as ModifiedConfig), usage }
}
