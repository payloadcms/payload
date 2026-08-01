import { z } from 'zod'

import type { Where } from '../types/index.js'

import { validOperators } from '../types/constants.js'

export const idSchema = z.union([z.string(), z.number()])

export const depthSchema = z
  .number()
  .int()
  .min(0)
  .max(10)
  .describe('How many levels deep to populate relationships in the response')
  .optional()
  .default(0)

export const localeSchema = z
  .string()
  .describe('Optional: locale code for the operation')
  .optional()

export const fallbackLocaleSchema = z
  .string()
  .describe('Fallback locale to use when the requested locale is unavailable')
  .optional()

export const populateSchema = z
  .record(z.string(), z.unknown())
  .describe(
    'Optional: control which fields to include from populated relationship or upload documents.',
  )
  .optional()

export const selectSchema = z
  .record(z.string(), z.unknown())
  .describe("Optional: define exactly which fields you'd like to return in the response")
  .optional()

export const sortSchema = z
  .union([z.string(), z.array(z.string())])
  .describe('Field or fields to sort by; prefix a field with - for descending order')
  .optional()

export const dataSchema = z.record(z.string(), z.unknown()).describe('Document data')

const whereFieldSchema = z
  .partialRecord(z.enum(validOperators), z.unknown())
  .describe('Field query operators')

export const operationWhereSchema: z.ZodType<Where> = z
  .lazy(() =>
    z
      .object({
        and: z.array(operationWhereSchema).optional(),
        or: z.array(operationWhereSchema).optional(),
      })
      .catchall(whereFieldSchema),
  )
  .describe('Where clause using field names with Payload query operators, plus and/or groups')

export const collectionSchema = z.string().describe('The collection slug')
export const globalSchema = z.string().describe('The global slug')
export const authEmailSchema = z.string().email().describe('The user email address')
export const authIdentifierSchema = {
  email: authEmailSchema.optional(),
  username: z.string().describe('The username').optional(),
}
export const requestSchema = z.unknown().describe('The Payload request')

export const collectionInput = {
  collection: collectionSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}

export const paginatedInput = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('Maximum number of results to return')
    .optional()
    .default(10),
  page: z.number().int().min(1).describe('Page number').optional().default(1),
  pagination: z.boolean().describe('Whether to paginate and perform a count query').optional(),
  sort: sortSchema,
  where: operationWhereSchema.optional(),
}

export const globalInput = {
  slug: globalSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}
