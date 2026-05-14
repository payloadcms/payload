import { generateText, Output } from 'ai'

import type { CodegenRunner } from './types.js'

import { DEFAULT_RUNNER_MODEL } from '../models.js'
import { ModifiedConfigSchema } from '../schemas.js'
import { SYSTEM_PROMPTS } from './systemPrompts.js'

export const llmRunner: CodegenRunner = {
  async run(instruction, starterConfig, options) {
    const { model = DEFAULT_RUNNER_MODEL, systemPromptKey = 'codegenWithSkill' } = options
    const system =
      systemPromptKey === 'codegenNoSkill'
        ? SYSTEM_PROMPTS.codegenNoSkill
        : SYSTEM_PROMPTS.codegenWithSkill

    // Cast generateText to any to prevent ai SDK overload resolution from recursing
    // too deeply over the Zod schema tree when resolving Output.object({ schema }).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { output, usage } = await (generateText as any)({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output: Output.object({ schema: ModifiedConfigSchema as any }),
      system,
      prompt: `Task: ${instruction}

Starter payload.config.ts:
${starterConfig}`,
    })

    return { ...output, usage }
  },
}
