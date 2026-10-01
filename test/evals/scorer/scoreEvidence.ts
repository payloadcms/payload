import { generateText, Output } from 'ai'

import type { ConfigChangeScorerResult, ScoreConfigChangeOptions } from '../types.js'

import { DEFAULT_SCORER_MODEL } from '../models.js'
import { ConfigChangeScoreSchema } from '../schemas.js'
import { SCORE_THRESHOLD } from '../thresholds.js'

/**
 * Scores arbitrary evidence collected during `verify`, such as database state
 * read from a real Payload instance.
 */
export async function scoreEvidence(
  instruction: string,
  expected: string,
  evidence: unknown,
  options: ScoreConfigChangeOptions = {},
): Promise<ConfigChangeScorerResult> {
  const { model = DEFAULT_SCORER_MODEL } = options

  const { output, usage } = await generateText({
    model,
    output: Output.object({ schema: ConfigChangeScoreSchema }),
    prompt: `Task: ${instruction}

Expected outcome: ${expected}

--- EVIDENCE ---
${JSON.stringify(evidence, null, 2)}

Score whether the evidence proves the task was completed.`,
    system: `You are an impartial evaluator of Payload CMS task outcomes.

Score two dimensions independently, each from 0.0 to 1.0:

correctness — Does the evidence show the requested result is present and correct?
  1.0 = the exact result is present
  0.7 = the result is present with minor issues
  0.4 = a related result is present but does not match the requirement
  0.0 = the result is missing or fundamentally wrong

completeness — Does the evidence cover the full expected outcome?
  1.0 = all expected data/behavior is shown
  0.7 = mostly complete, one minor part missing or incorrect
  0.4 = partially complete, key parts missing
  0.0 = barely started or absent

Only score what is supported by the evidence. If the evidence is missing the
needed data, lower completeness even if the generated config might be correct.`,
  })

  const correctness = Math.max(0, Math.min(1, output.correctness))
  const completeness = Math.max(0, Math.min(1, output.completeness))
  const score = 0.6 * correctness + 0.4 * completeness
  const pass = score >= SCORE_THRESHOLD

  return {
    ...output,
    completeness,
    correctness,
    pass,
    score,
    usage: {
      cachedInputTokens: usage.inputTokenDetails.cacheReadTokens ?? 0,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
    },
  }
}
