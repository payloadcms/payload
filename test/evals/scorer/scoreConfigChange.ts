import { generateText, Output } from 'ai'

import type { ConfigChangeScorerResult, ScoreConfigChangeOptions } from '../types.js'

import { DEFAULT_SCORER_MODEL } from '../models.js'
import { ConfigChangeScoreSchema } from '../schemas.js'
import { SCORE_THRESHOLD } from '../thresholds.js'

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

  const { output, usage } = await generateText({
    model,
    output: Output.object({ schema: ConfigChangeScoreSchema }),
    prompt: `Task: ${instruction}

Expected outcome: ${expected}

--- ORIGINAL CONFIG ---
${starterConfig}

--- MODIFIED CONFIG ---
${modifiedConfig}

Score the modification on correctness and completeness. Name the precise change that was made.`,
    system: `You are an impartial evaluator of Payload CMS TypeScript config modifications.

Score two dimensions independently, each from 0.0 to 1.0:

correctness — Is the requested change present and correct?
  1.0 = the exact change was made correctly
  0.7 = the change is present but with minor issues (e.g. slightly wrong option name)
  0.4 = a related change was made but it does not match the requirement
  0.0 = the change is missing or fundamentally wrong

completeness — Is the change fully implemented?
  1.0 = all required properties and values are set correctly
  0.7 = mostly complete, one minor property missing or incorrect
  0.4 = partially implemented, key parts missing
  0.0 = barely started or not present

Important scoring guidance:
- Award high correctness if the right construct is used, even if a minor property differs
- Preserving all existing config unchanged is expected and should not affect the score
- Adding reasonable supporting code (e.g. an import) alongside the change is fine
- Only penalize correctness for things that are actually wrong, not for things that are absent
- Absence of a required property lowers completeness, not correctness`,
  })

  const score = 0.6 * output.correctness + 0.4 * output.completeness
  const pass = score >= SCORE_THRESHOLD

  return { ...output, pass, score, usage }
}
