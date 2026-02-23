import { generateText, Output } from 'ai'

import type { ScoreAnswerOptions, ScorerResult } from '../types.js'

import { DEFAULT_SCORER_MODEL } from '../models.js'
import { ScoreSchema } from '../schemas.js'

export async function scoreAnswer(
  question: string,
  expected: string,
  actual: string,
  options: ScoreAnswerOptions = {},
): Promise<ScorerResult> {
  const { model = DEFAULT_SCORER_MODEL } = options

  const { output } = await generateText({
    model,
    output: Output.object({ schema: ScoreSchema }),
    system:
      'You are an impartial evaluator. Judge whether the actual answer correctly conveys all the key concepts from the expected answer. Minor wording differences are fine — focus on whether the core facts are present and accurate.',
    prompt: `Question: ${question}

Expected concepts: ${expected}

Actual answer: ${actual}

Does the actual answer correctly convey the expected concepts?`,
  })

  return output
}
