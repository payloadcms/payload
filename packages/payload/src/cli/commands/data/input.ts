import { readFileSync } from 'node:fs'
import path from 'node:path'
import * as z from 'zod/mini'

export const collectionSlugSchema = z.string().check(z.minLength(1), z.describe('Collection slug.'))
export const dataSchema = z.record(z.string(), z.unknown()).check(z.describe('Document data.'))
export const defaultLimitSchema = z
  ._default(z.number(), 10)
  .check(z.describe('Maximum number of results.'))
export const defaultPageSchema = z._default(z.number(), 1).check(z.describe('Result page.'))
export const depthSchema = z
  ._default(z.number(), 0)
  .check(z.describe('Relationship population depth.'))
export const draftSchema = z
  .optional(z.boolean())
  .check(z.describe('Include or write draft content.'))
export const fallbackLocaleSchema = z
  .optional(z.union([z.string(), z.literal(false)]))
  .check(z.describe('Fallback locale, or false to disable fallback.'))
export const fieldSchema = z.string().check(z.minLength(1), z.describe('Field path.'))
export const fileSchema = z
  .optional(z.string().check(z.minLength(1)))
  .check(z.describe('Upload file path.'))
export const globalSlugSchema = z.string().check(z.minLength(1), z.describe('Global slug.'))
export const idSchema = z
  .union([z.string().check(z.minLength(1)), z.number()])
  .check(z.describe('Document or version ID.'))
export const joinsSchema = z
  .optional(z.union([z.literal(false), z.record(z.string(), z.unknown())]))
  .check(z.describe('Join query.'))
export const limitSchema = z.optional(z.number()).check(z.describe('Maximum number of results.'))
export const localeSchema = z.optional(z.string()).check(z.describe('Locale.'))
export const overwriteExistingFilesSchema = z
  ._default(z.boolean(), false)
  .check(z.describe('Overwrite existing files.'))
export const overrideLockSchema = z
  ._default(z.boolean(), true)
  .check(z.describe('Respect document locks.'))
export const pageSchema = z.optional(z.number()).check(z.describe('Result page.'))
export const paginationSchema = z
  ._default(z.boolean(), true)
  .check(z.describe('Enable pagination.'))
export const populateSchema = z
  .optional(z.record(z.string(), z.unknown()))
  .check(z.describe('Population configuration.'))
export const publishAllLocalesSchema = z
  .optional(z.boolean())
  .check(z.describe('Publish all locales.'))
export const selectSchema = z
  .optional(z.record(z.string(), z.unknown()))
  .check(z.describe('Field selection.'))
export const selectedLocalesSchema = z
  .optional(z.array(z.string()))
  .check(z.describe('Selected locales.'))
export const showHiddenFieldsSchema = z
  .optional(z.boolean())
  .check(z.describe('Include hidden fields.'))
export const sortSchema = z
  .optional(z.union([z.string(), z.array(z.string())]))
  .check(z.describe('Sort fields.'))
export const trashSchema = z
  .optional(z.boolean())
  .check(z.describe('Read from or include the trash.'))
export const unpublishAllLocalesSchema = z
  .optional(z.boolean())
  .check(z.describe('Unpublish all locales.'))
export const whereSchema = z
  .optional(z.record(z.string(), z.unknown()))
  .check(z.describe('Where query.'))
export const writeDraftSchema = z
  ._default(z.boolean(), false)
  .check(z.describe('Write draft content.'))

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

export const parseDocuments = (value: string, previous: unknown): unknown[] => {
  const parsed = parseJSON(value)
  const previousValues = Array.isArray(previous) ? previous : []

  return [...previousValues, ...(Array.isArray(parsed) ? parsed : [parsed])]
}

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
