import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

export const collectionSlugSchema = z.string().min(1).describe('Collection slug.')
export const dataSchema = z.record(z.string(), z.unknown()).describe('Document data.')
export const defaultLimitSchema = z.number().default(10).describe('Maximum number of results.')
export const defaultPageSchema = z.number().default(1).describe('Result page.')
export const depthSchema = z.number().default(0).describe('Relationship population depth.')
export const documentDataSchema = z.array(dataSchema).min(1).describe('Documents to create.')
export const draftSchema = z.boolean().optional().describe('Include or write draft content.')
export const fallbackLocaleSchema = z
  .union([z.string(), z.literal(false)])
  .optional()
  .describe('Fallback locale, or false to disable fallback.')
export const fieldSchema = z.string().min(1).describe('Field path.')
export const fileSchema = z.string().min(1).optional().describe('Upload file path.')
export const filesSchema = z
  .array(z.string().min(1))
  .optional()
  .describe('Upload file paths, one per document.')
export const globalSlugSchema = z.string().min(1).describe('Global slug.')
export const idSchema = z.union([z.string().min(1), z.number()]).describe('Document or version ID.')
export const joinsSchema = z
  .union([z.literal(false), z.record(z.string(), z.unknown())])
  .optional()
  .describe('Join query.')
export const limitSchema = z.number().optional().describe('Maximum number of results.')
export const localeSchema = z.string().optional().describe('Locale.')
export const overwriteExistingFilesSchema = z
  .boolean()
  .default(false)
  .describe('Overwrite existing files.')
export const overrideLockSchema = z.boolean().default(true).describe('Respect document locks.')
export const pageSchema = z.number().optional().describe('Result page.')
export const paginationSchema = z.boolean().default(true).describe('Enable pagination.')
export const populateSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe('Population configuration.')
export const publishAllLocalesSchema = z.boolean().optional().describe('Publish all locales.')
export const selectSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe('Field selection.')
export const selectedLocalesSchema = z.array(z.string()).optional().describe('Selected locales.')
export const showHiddenFieldsSchema = z.boolean().optional().describe('Include hidden fields.')
export const sortSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .describe('Sort fields.')
export const trashSchema = z.boolean().optional().describe('Read from or include the trash.')
export const unpublishAllLocalesSchema = z.boolean().optional().describe('Unpublish all locales.')
export const whereSchema = z.record(z.string(), z.unknown()).optional().describe('Where query.')
export const writeDraftSchema = z.boolean().default(false).describe('Write draft content.')

export const parseFallbackLocale = (value: string): false | string =>
  value === 'false' ? false : value

export const parseID = (value: string): number | string => {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : value
}

export const parseJSON = (value: string): unknown => {
  let source = value

  if (value.startsWith('@')) {
    source = readFileSync(path.resolve(process.cwd(), value.slice(1)), 'utf8')
  }

  try {
    return JSON.parse(source) as unknown
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid JSON.')
  }
}

export const parseDocumentData = (value: string, previous: unknown): unknown[] => {
  const parsed = parseJSON(value)
  const previousValues = Array.isArray(previous) ? previous : []

  return [...previousValues, ...(Array.isArray(parsed) ? parsed : [parsed])]
}

export const parseRepeatedValue = (value: string, previous: unknown): string[] => [
  ...(Array.isArray(previous) ? previous : []),
  value,
]

export const parseSelectedLocales = (value: string, previous: unknown): string[] => [
  ...(Array.isArray(previous) ? previous : []),
  ...value.split(',').filter(Boolean),
]

export const parseSort = (value: string, previous: unknown): string | string[] => {
  if (Array.isArray(previous)) {
    return [...previous, value] as string[]
  }

  return typeof previous === 'string' ? [previous, value] : value
}
