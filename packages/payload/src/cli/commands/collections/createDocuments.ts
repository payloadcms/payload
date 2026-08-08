import path from 'node:path'
import * as z from 'zod/mini'

import type { PopulateType, SelectType } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  dataSchema,
  depthSchema,
  fallbackLocaleSchema,
  localeSchema,
  overwriteExistingFilesSchema,
  parseDocuments,
  parseFallbackLocale,
  parseJSON,
  populateSchema,
  publishAllLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  writeDraftSchema,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createCreateDocumentsCommand = defineCLICommand({
  cli: {
    documents: { flags: '--documents <json|@file>', parse: parseDocuments },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Create one or more documents in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const collection = args.slug
    const docs: Array<{ doc: unknown; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []

    for (const [index, { data, file }] of args.documents.entries()) {
      try {
        const doc = await payload.create({
          collection,
          data: prepareCollectionData({ collection, data, payload }),
          depth: args.depth,
          draft: args.draft,
          fallbackLocale: args.fallbackLocale,
          filePath: file ? path.resolve(process.cwd(), file) : undefined,
          locale: args.locale,
          overrideAccess: true,
          overwriteExistingFiles: args.overwriteExistingFiles,
          populate: args.populate as PopulateType | undefined,
          publishAllLocales: args.publishAllLocales,
          select: args.select as SelectType | undefined,
          showHiddenFields: args.showHiddenFields,
        })

        docs.push({ doc, index })
      } catch (error) {
        errors.push({
          index,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    printJSON({ docs, errors })

    return errors.length > 0 ? 1 : undefined
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: collectionSlugSchema,
    depth: depthSchema,
    documents: z
      .array(
        z.object({
          data: dataSchema,
          file: z.optional(z.string()),
        }),
      )
      .check(z.minLength(1), z.describe('Documents to create.')),
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    overwriteExistingFiles: overwriteExistingFilesSchema,
    populate: populateSchema,
    publishAllLocales: publishAllLocalesSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
  }),
})
