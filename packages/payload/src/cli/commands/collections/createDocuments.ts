import path from 'node:path'

import type { EntityInputSchema } from '../../../utilities/entityInputSchema/types.js'

import { createDocumentsLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { hasDraftValidationEnabled } from '../../../utilities/getVersionsConfig.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  localFileSchema,
  parseBoolean,
  parseDocuments,
  parseFallbackLocale,
  parseJSON,
} from '../data/input.js'
import {
  getCollectionValidationResult,
  prepareCollectionData,
  printJSON,
  stripCollectionVirtualFields,
  validateCollectionData,
} from '../data/utilities.js'

export const createCreateDocumentsCommand = defineCLICommand({
  cli: {
    documents: { flags: '--documents <json|@file>', parse: parseDocuments },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Create one or more documents in a local collection.',
  examples: [
    `payload createDocuments --slug posts --documents '[{"data":{"title":"First post"}}]'`,
    'payload createDocuments --input @create-posts.json',
  ],
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const collectionConfig = payload.collections[collection]?.config
    const docs: Array<{ doc: unknown; index: number } | { id: number | string; index: number }> = []
    const errors: Array<{ index: number; issues?: unknown[]; message: string }> = []
    let schema: EntityInputSchema | undefined
    const req = await createLocalReq({}, payload)
    const shouldUsePartialSchema =
      args.draft === true &&
      collectionConfig !== undefined &&
      !hasDraftValidationEnabled(collectionConfig)

    for (const [index, { data, file }] of args.documents.entries()) {
      const inputData = stripCollectionVirtualFields({ collection, data, payload })

      try {
        validateCollectionData({
          slug: collection,
          data: inputData,
          partial: shouldUsePartialSchema,
          req,
        })

        const doc = await payload.create({
          collection,
          data: prepareCollectionData({ collection, data: inputData, payload }),
          depth: args.depth,
          draft: args.draft,
          fallbackLocale: args.fallbackLocale,
          filePath: file ? path.resolve(process.cwd(), file) : undefined,
          locale: args.locale,
          overrideAccess: args.overrideAccess,
          overwriteExistingFiles: args.overwriteExistingFiles,
          populate: args.populate,
          publishAllLocales: args.publishAllLocales,
          select: args.returning ? args.select : { id: true },
          showHiddenFields: args.showHiddenFields,
        })

        docs.push(args.returning ? { doc, index } : { id: doc.id, index })
      } catch (error) {
        const validation = getCollectionValidationResult({ slug: collection, error, req })

        if (validation) {
          schema = validation.schema
        }

        errors.push({
          index,
          ...(validation ? { issues: validation.errors } : {}),
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const result = {
      docs,
      errors,
      ...(schema ? { slug: collection, schema } : {}),
    }

    if (!isJSON) {
      printJSON(result)
    }

    return {
      exitCode: errors.length > 0 ? 1 : undefined,
      result,
    }
  },
  helpGroup: 'Data commands',
  input: createDocumentsLocalInputSchema({ file: localFileSchema }),
})
