import { z } from 'zod'

export const AnswerSchema = z.object({
  answer: z.string().describe('The answer or generated code'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (unsure) to 1 (certain)'),
})

export const ModifiedConfigSchema = z.object({
  modifiedConfig: z
    .string()
    .describe('The complete modified payload.config.ts file content — no prose, no code fences'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (unsure) to 1 (certain)'),
})

export const ScoreSchema = z.object({
  pass: z.boolean().describe('True if the actual answer correctly conveys the expected concepts'),
  reasoning: z.string().describe('Brief explanation of why the answer passes or fails'),
})

export const ConfigChangeScoreSchema = z.object({
  pass: z
    .boolean()
    .describe('True if the modified config correctly fulfills the task and expected change'),
  reasoning: z.string().describe('Brief explanation of why the change passes or fails'),
  changeDescription: z
    .string()
    .describe(
      'One sentence naming the precise change made, e.g. "added select field \'status\' with options draft/published/archived to posts.fields"',
    ),
})
