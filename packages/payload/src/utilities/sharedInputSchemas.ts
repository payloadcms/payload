/**
 * Small input schemas shared by the collection and global operation schemas.
 *
 * Keeping common fields here avoids redefining values such as `slug`, `locale`, and `depth` for
 * every operation in `collections/operations/inputSchemas.ts` and `globals/operations/inputSchemas.ts`.
 */
import * as z from 'zod/mini'

import type { SelectExcludeType, SelectIncludeType, Where } from '../types/index.js'

import { validOperators } from '../types/constants.js'
import { strictObject } from './zod.js'

export const getConfigInfoInputSchema = strictObject({})

export const dataSchema = z
  .record(z.string(), z.unknown())
  .check(z.describe('The document fields.'))
export const defaultLimitSchema = z
  ._default(z.int().check(z.minimum(1), z.maximum(100)), 10)
  .check(z.describe('Maximum number of results.'))
export const defaultPageSchema = z
  ._default(z.int().check(z.minimum(1)), 1)
  .check(z.describe('Result page.'))
export const depthSchema = z
  ._default(z.int().check(z.minimum(0), z.maximum(10)), 0)
  .check(z.describe('How many levels deep to populate relationships.'))
export const draftSchema = z
  .optional(z.boolean())
  .check(z.describe('Include or read draft content.'))
export const fallbackLocaleSchema = z
  .optional(z.union([z.string(), z.literal(false)]))
  .check(z.describe('Optional fallback locale code, or false to disable fallback.'))
export const fieldSchema = z.string().check(z.minLength(1), z.describe('Field path.'))
export const idSchema = z
  .union([z.string().check(z.minLength(1)), z.number()])
  .check(z.describe('Document or version ID.'))
export const limitSchema = z
  .optional(z.int().check(z.minimum(1), z.maximum(100)))
  .check(z.describe('Maximum number of results.'))
export const localeSchema = z
  .optional(z.string())
  .check(z.describe('Optional locale code for localized fields.'))
export const overwriteExistingFilesSchema = z
  ._default(z.boolean(), false)
  .check(z.describe('Overwrite existing files.'))
export const overrideAccessSchema = z
  ._default(z.boolean(), true)
  .check(z.describe('Bypass access control.'))
export const overrideLockSchema = z
  ._default(z.boolean(), true)
  .check(z.describe('Override document locks.'))
export const pageSchema = z.optional(z.int().check(z.minimum(1))).check(z.describe('Result page.'))
export const paginationSchema = z
  ._default(z.boolean(), true)
  .check(z.describe('Enable pagination.'))
const selectIncludeInputSchema: z.ZodMiniType<SelectIncludeType> = z.lazy(() =>
  z.record(z.string(), z.union([z.literal(true), selectIncludeInputSchema])),
)

const selectExcludeInputSchema: z.ZodMiniType<SelectExcludeType> = z.lazy(() =>
  z.record(z.string(), z.union([z.literal(false), selectExcludeInputSchema])),
)

const selectInputSchema = z
  .union([selectIncludeInputSchema, selectExcludeInputSchema])
  .check(z.meta({ type: 'object' }))

export const populateSchema = z
  .optional(z.record(z.string(), selectInputSchema))
  .check(
    z.describe(
      'Optional: control which fields to include from populated relationship or upload documents.',
    ),
  )
export const publishAllLocalesSchema = z
  .optional(z.boolean())
  .check(z.describe('Publish all locales.'))
export const returningSchema = z
  ._default(z.boolean(), false)
  .check(z.describe('Return complete documents instead of only their IDs.'))
export const selectSchema = z
  .optional(selectInputSchema)
  .check(
    z.describe(
      'Optional: define exactly which fields you\'d like to return in the response, for example {"title": true}.',
    ),
  )
export const selectedLocalesSchema = z
  .optional(z.array(z.string()))
  .check(z.describe('Localized field locales to include.'))
export const showHiddenFieldsSchema = z
  .optional(z.boolean())
  .check(z.describe('Include hidden fields.'))
export const sortSchema = z
  .optional(z.union([z.string(), z.array(z.string())]))
  .check(z.describe('Fields to sort by. Prefix a field with - for descending order.'))
export const trashSchema = z
  .optional(z.boolean())
  .check(z.describe('Read from or include the trash.'))
export const unpublishAllLocalesSchema = z
  .optional(z.boolean())
  .check(z.describe('Unpublish all locales.'))
export const writeDraftSchema = z
  ._default(z.boolean(), false)
  .check(z.describe('Write draft content.'))
export const slugSchema = z.string().check(z.minLength(1), z.describe('The target slug.'))

const whereFieldSchema = z.partialRecord(z.enum(validOperators), z.unknown())

const whereInputSchema: z.ZodMiniType<Where> = z.lazy(() =>
  z.catchall(
    z.strictObject({
      and: z.optional(z.array(whereInputSchema)),
      or: z.optional(z.array(whereInputSchema)),
    }),
    whereFieldSchema,
  ),
)

export const joinsSchema = z
  .optional(
    z.union([
      z.literal(false),
      z.record(
        z.string(),
        z.union([
          z.literal(false),
          z.strictObject({
            count: z.optional(z.boolean()),
            limit: z.optional(z.number()),
            page: z.optional(z.number()),
            sort: z.optional(z.string()),
            where: z.optional(whereInputSchema),
          }),
        ]),
      ),
    ]),
  )
  .check(z.describe('Optional: configure join field queries, or pass false to disable all joins.'))

export const whereSchema = z
  .optional(whereInputSchema)
  .check(z.describe('Where query using Payload field operators and and/or groups.'))

export const requireIDOrWhere = (
  options: { id?: number | string; where?: unknown },
  context: z.core.$RefinementCtx,
): void => {
  if (options.id === undefined && !options.where) {
    context.addIssue({
      code: 'custom',
      message: 'Either id or where must be provided.',
      path: ['id'],
    })
  }
}

export const requireReturningForSelect = (
  options: { returning?: boolean; select?: unknown },
  context: z.core.$RefinementCtx,
): void => {
  if (options.select !== undefined && options.returning !== true) {
    context.addIssue({
      code: 'custom',
      message: 'select requires returning to be true.',
      path: ['select'],
    })
  }
}
