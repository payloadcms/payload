import path from 'node:path'
import { z } from 'zod'

import type { PopulateType, SelectType } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import {
  collectionSlugSchema,
  depthSchema,
  documentDataSchema,
  fallbackLocaleSchema,
  filesSchema,
  localeSchema,
  overwriteExistingFilesSchema,
  parseDocumentData,
  parseFallbackLocale,
  parseJSON,
  parseRepeatedValue,
  populateSchema,
  publishAllLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  writeDraftSchema,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

const input = z
  .strictObject({
    slug: collectionSlugSchema,
    data: documentDataSchema,
    depth: depthSchema,
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    file: filesSchema,
    locale: localeSchema,
    overwriteExistingFiles: overwriteExistingFilesSchema,
    populate: populateSchema,
    publishAllLocales: publishAllLocalesSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
  })
  .superRefine((args, context) => {
    if (args.file?.length && args.file.length !== args.data.length) {
      context.addIssue({
        code: 'custom',
        message: 'Pass one --file for each document when creating multiple documents.',
        path: ['file'],
      })
    }
  })

export const createCreateDocumentsCommand = defineCLICommand({
  name: 'createDocuments',
  cli: {
    data: { flags: '--data <json|@file>', parse: parseDocumentData },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    file: { flags: '--file <path>', parse: parseRepeatedValue },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Create one or more documents in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const collection = args.slug
    const docs: Array<{ doc: unknown; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []

    for (const [index, data] of args.data.entries()) {
      try {
        const file = args.file?.[index]
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
  input,
})
