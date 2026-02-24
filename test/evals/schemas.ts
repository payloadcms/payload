import { z } from 'zod'

export const AnswerSchema = z.object({
  answer: z.string().describe('The answer or generated code'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (unsure) to 1 (certain)'),
})

export const ModifiedConfigSchema = z.object({
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (unsure) to 1 (certain)'),
  modifiedConfig: z
    .string()
    .describe('The complete modified payload.config.ts file content — no prose, no code fences'),
})

export const ScoreSchema = z.object({
  completeness: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Score from 0–1: what fraction of the expected key concepts are covered? 1.0 = all key concepts present, 0.5 = about half covered',
    ),
  correctness: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Score from 0–1: how factually accurate is the answer? 1.0 = all stated facts are correct, 0.0 = fundamentally wrong',
    ),
  reasoning: z.string().describe('Brief explanation citing specific correct or missing concepts'),
})

export const ConfigChangeScoreSchema = z.object({
  changeDescription: z
    .string()
    .describe(
      'One sentence naming the precise change made, e.g. "added select field \'status\' with options draft/published/archived to posts.fields"',
    ),
  completeness: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Score from 0–1: is the change fully implemented? 1.0 = all required properties set, 0.5 = partially done',
    ),
  correctness: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Score from 0–1: is the requested change present and correct? 1.0 = exact change made correctly, 0.0 = change missing or wrong',
    ),
  reasoning: z.string().describe('Brief explanation of what was correct, missing, or wrong'),
})
