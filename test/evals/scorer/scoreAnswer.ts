import { generateText, Output } from 'ai'

import type { ScoreAnswerOptions, ScorerResult } from '../types.js'

import { DEFAULT_SCORER_MODEL } from '../models.js'
import { ScoreSchema } from '../schemas.js'
import { SCORE_THRESHOLD } from '../thresholds.js'

export async function scoreAnswer(
  question: string,
  expected: string,
  actual: string,
  options: ScoreAnswerOptions = {},
): Promise<ScorerResult> {
  const { model = DEFAULT_SCORER_MODEL } = options

  const { output, usage } = await generateText({
    model,
    output: Output.object({ schema: ScoreSchema }),
    prompt: `Question: ${question}

Expected key concepts: ${expected}

Actual answer: ${actual}

Score the answer on correctness and completeness.`,
    system: `You are an impartial evaluator scoring AI answers about Payload CMS.

Score two dimensions independently, each from 0.0 to 1.0:

correctness — Are the stated facts accurate?
  1.0 = every fact stated is correct
  0.7 = mostly correct with minor inaccuracies
  0.4 = some correct facts but important errors present
  0.0 = fundamentally wrong

completeness — What fraction of the KEY concepts from the expected answer are covered?
  1.0 = all key concepts present
  0.7 = most key concepts present, one or two missing
  0.4 = roughly half the key concepts present
  0.0 = none of the expected concepts mentioned

Important scoring guidance:
- Award high correctness if the core idea is right, even if phrased differently
- Adding correct additional information beyond what the expected answer lists should NOT lower the score
- Only penalize correctness for facts that are actually wrong, not for facts that are simply absent
- Absence of detail lowers completeness, not correctness
- Partial coverage of a concept counts — do not treat partial coverage as zero`,
  })

  const score = 0.6 * output.correctness + 0.4 * output.completeness
  const pass = score >= SCORE_THRESHOLD

  return { ...output, pass, score, usage }
}
