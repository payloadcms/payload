import { generateText, Output } from 'ai'

import type { ConfigChangeScorerResult, ScoreConfigChangeOptions } from '../types.js'

import { DEFAULT_SCORER_MODEL } from '../models.js'
import { ConfigChangeScoreSchema } from '../schemas.js'

/**
 * Scores a config modification by comparing the before/after state.
 * The scorer sees both the original and modified config, names the precise change,
 * and verifies it matches the expected description.
 */
export async function scoreConfigChange(
  instruction: string,
  expected: string,
  starterConfig: string,
  modifiedConfig: string,
  options: ScoreConfigChangeOptions = {},
): Promise<ConfigChangeScorerResult> {
  const { model = DEFAULT_SCORER_MODEL } = options

  const { output } = await generateText({
    model,
    output: Output.object({ schema: ConfigChangeScoreSchema }),
    system:
      'You are an impartial evaluator of Payload CMS TypeScript configs. You will be shown an original config, a modified config, the task that was performed, and the expected outcome. Assess whether the modification correctly fulfills the task. Name the precise change that was made.',
    prompt: `Task: ${instruction}

Expected outcome: ${expected}

--- ORIGINAL CONFIG ---
${starterConfig}

--- MODIFIED CONFIG ---
${modifiedConfig}

Did the modified config correctly fulfill the task? Name the precise change that was made.`,
  })

  return output
}
