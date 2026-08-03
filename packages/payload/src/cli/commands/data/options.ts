import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

import type { JoinQuery, Sort } from '../../../index.js'

import { defineCLIOption } from '../../zodCommand.js'

const jsonArgument = z.string().transform(async (value, context): Promise<unknown> => {
  let source = value

  if (value.startsWith('@')) {
    try {
      source = await fs.readFile(path.resolve(process.cwd(), value.slice(1)), 'utf8')
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Could not read JSON file.',
      })
      return z.NEVER
    }
  }

  try {
    return JSON.parse(source)
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Invalid JSON.',
    })
    return z.NEVER
  }
})

const jsonObjectArgument = jsonArgument.pipe(z.record(z.string(), z.unknown()))
const optionalBooleanArgument = z.boolean().optional()
const falseByDefaultBooleanArgument = z.boolean().default(false)

export const collectionSlugOption = defineCLIOption({
  description: 'Collection slug.',
  schema: z.string().min(1),
  valueName: 'collection',
})

export const globalSlugOption = defineCLIOption({
  description: 'Global slug.',
  schema: z.string().min(1),
  valueName: 'global',
})

export const idOption = defineCLIOption({
  description: 'Document or version ID.',
  schema: z
    .string()
    .min(1)
    .transform((value): number | string => {
      const numericValue = Number(value)

      return Number.isFinite(numericValue) ? numericValue : value
    }),
  valueName: 'id',
})

export const optionalIDOption = defineCLIOption({
  ...idOption,
  description: idOption.schema.description ?? 'Document or version ID.',
  schema: idOption.schema.optional(),
})

export const depthOption = defineCLIOption({
  description: 'Relationship population depth.',
  schema: z.coerce.number().default(0),
  valueName: 'number',
})

export const draftOption = defineCLIOption({
  description: 'Include or write draft content.',
  schema: optionalBooleanArgument,
})

export const falseByDefaultDraftOption = defineCLIOption({
  description: 'Write draft content.',
  schema: falseByDefaultBooleanArgument,
})

export const fallbackLocaleOption = defineCLIOption({
  description: 'Fallback locale, or "false" to disable fallback.',
  schema: z
    .string()
    .transform((value): false | string => (value === 'false' ? false : value))
    .optional(),
  valueName: 'locale|false',
})

export const localeOption = defineCLIOption({
  description: 'Locale.',
  schema: z.string().optional(),
  valueName: 'locale',
})

export const populateOption = defineCLIOption({
  description: 'Population configuration as JSON or @path/to/file.json.',
  schema: jsonObjectArgument.optional(),
  valueName: 'json|@file',
})

export const selectOption = defineCLIOption({
  description: 'Field selection as JSON or @path/to/file.json.',
  schema: jsonObjectArgument.optional(),
  valueName: 'json|@file',
})

export const showHiddenFieldsOption = defineCLIOption({
  description: 'Include hidden fields.',
  schema: optionalBooleanArgument,
})

export const whereOption = defineCLIOption({
  description: 'Where query as JSON or @path/to/file.json.',
  schema: jsonObjectArgument.optional(),
  valueName: 'json|@file',
})

export const trashOption = defineCLIOption({
  description: 'Read from or include the trash.',
  schema: optionalBooleanArgument,
})

export const optionalLimitOption = defineCLIOption({
  description: 'Maximum number of results.',
  schema: z.coerce.number().optional(),
  valueName: 'number',
})

export const defaultLimitOption = defineCLIOption({
  ...optionalLimitOption,
  description: optionalLimitOption.schema.description ?? 'Maximum number of results.',
  schema: z.coerce.number().default(10),
})

export const optionalPageOption = defineCLIOption({
  description: 'Result page.',
  schema: z.coerce.number().optional(),
  valueName: 'number',
})

export const defaultPageOption = defineCLIOption({
  ...optionalPageOption,
  description: optionalPageOption.schema.description ?? 'Result page.',
  schema: z.coerce.number().default(1),
})

export const paginationOption = defineCLIOption({
  description: 'Disable pagination.',
  flags: '--no-pagination',
  schema: z.boolean().default(true),
})

export const sortOption = defineCLIOption({
  description: 'Sort field. Repeat the option to sort by multiple fields.',
  isRepeatable: true,
  schema: z
    .array(z.string())
    .transform((values): Sort => (values.length === 1 ? values[0]! : values))
    .optional(),
  valueName: 'field',
})

export const fieldOption = defineCLIOption({
  description: 'Field path.',
  schema: z.string().min(1),
  valueName: 'path',
})

export const joinsOption = defineCLIOption({
  description: 'Join query as JSON or @path/to/file.json.',
  schema: jsonArgument
    .refine(
      (value) => value === false || (!!value && typeof value === 'object' && !Array.isArray(value)),
      { message: 'Must contain a JSON object or false.' },
    )
    .transform((value) => value as false | JoinQuery)
    .optional(),
  valueName: 'json|@file',
})

export const selectedLocalesOption = defineCLIOption({
  description: 'Selected locale. Repeat the option or use comma-separated values.',
  isRepeatable: true,
  schema: z
    .array(z.string())
    .transform((values) => values.flatMap((value) => value.split(',').filter(Boolean)))
    .optional(),
  valueName: 'locale',
})

export const overwriteExistingFilesOption = defineCLIOption({
  description: 'Overwrite existing files.',
  schema: falseByDefaultBooleanArgument,
})

export const publishAllLocalesOption = defineCLIOption({
  description: 'Publish all locales.',
  schema: optionalBooleanArgument,
})

export const overrideLockOption = defineCLIOption({
  description: 'Respect document locks.',
  flags: '--no-override-lock',
  schema: z.boolean().default(true),
})

export const unpublishAllLocalesOption = defineCLIOption({
  description: 'Unpublish all locales.',
  schema: optionalBooleanArgument,
})

export const fileOption = defineCLIOption({
  description: 'Upload file path.',
  schema: z
    .string()
    .min(1)
    .transform((value) => path.resolve(process.cwd(), value))
    .optional(),
  valueName: 'path',
})

export const filesOption = defineCLIOption({
  description: 'Upload file path. Repeat once per document.',
  isRepeatable: true,
  schema: z
    .array(z.string().min(1))
    .transform((values) => values.map((value) => path.resolve(process.cwd(), value)))
    .optional(),
  valueName: 'path',
})

export const documentDataOption = defineCLIOption({
  description: 'Document data as JSON or @path/to/file.json. May be repeated.',
  isRepeatable: true,
  schema: z
    .array(jsonArgument)
    .transform((values) => values.flatMap((value) => (Array.isArray(value) ? value : [value])))
    .pipe(z.array(z.record(z.string(), z.unknown())).min(1)),
  valueName: 'json|@file',
})

export const requiredDataOption = defineCLIOption({
  description: 'Data as a JSON object or @path/to/file.json.',
  schema: jsonObjectArgument,
  valueName: 'json|@file',
})

export const optionalDataOption = defineCLIOption({
  ...requiredDataOption,
  description: requiredDataOption.schema.description ?? 'Data as a JSON object.',
  schema: jsonObjectArgument.optional(),
})

export const readOptions = {
  depth: depthOption,
  fallbackLocale: fallbackLocaleOption,
  locale: localeOption,
  populate: populateOption,
  select: selectOption,
  showHiddenFields: showHiddenFieldsOption,
}
