import path from 'node:path'

import { updateDocumentLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { parseDocumentID } from '../../../utilities/parseDocumentID.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  localFileSchema,
  parseBoolean,
  parseFallbackLocale,
  parseJSON,
  parseSort,
} from '../data/input.js'
import {
  getCollectionSchema,
  getCollectionValidationResult,
  prepareCollectionData,
  printJSON,
  stripCollectionVirtualFields,
  validateCollectionData,
} from '../data/utilities.js'

export const createUpdateDocumentCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Update documents in a local collection by ID or where query.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const inputData = stripCollectionVirtualFields({ collection, data: args.data, payload })
    const req = await createLocalReq({}, payload)
    try {
      validateCollectionData({
        slug: collection,
        data: inputData,
        partial: true,
        req,
      })

      const data = prepareCollectionData({ collection, data: inputData, payload })

      if (args.id !== undefined) {
        const doc = await payload.update({
          id: parseDocumentID({ id: args.id, collectionSlug: collection, payload }),
          collection,
          data,
          depth: args.depth,
          draft: args.draft,
          fallbackLocale: args.fallbackLocale,
          filePath: args.file ? path.resolve(process.cwd(), args.file) : undefined,
          locale: args.locale,
          overrideAccess: args.overrideAccess,
          overrideLock: args.overrideLock,
          overwriteExistingFiles: args.overwriteExistingFiles,
          populate: args.populate,
          publishAllLocales: args.publishAllLocales,
          select: args.returning ? args.select : { id: true },
          showHiddenFields: args.showHiddenFields,
          trash: args.trash,
          unpublishAllLocales: args.unpublishAllLocales,
        })

        const result = args.returning ? doc : { id: doc.id }

        if (!isJSON) {
          printJSON(result)
        }

        return { result }
      }

      if (args.where !== undefined) {
        const updateResult = await payload.update({
          collection,
          data,
          depth: args.depth,
          draft: args.draft,
          fallbackLocale: args.fallbackLocale,
          filePath: args.file ? path.resolve(process.cwd(), args.file) : undefined,
          limit: args.limit,
          locale: args.locale,
          overrideAccess: args.overrideAccess,
          overrideLock: args.overrideLock,
          overwriteExistingFiles: args.overwriteExistingFiles,
          populate: args.populate,
          publishAllLocales: args.publishAllLocales,
          select: args.returning ? args.select : { id: true },
          showHiddenFields: args.showHiddenFields,
          sort: args.sort,
          trash: args.trash,
          unpublishAllLocales: args.unpublishAllLocales,
          where: args.where,
        })

        if (updateResult.errors.length > 0) {
          const schema = getCollectionSchema({ slug: collection, req })
          const validationResult = {
            ...updateResult,
            ...(schema ? { slug: collection, schema } : {}),
          }

          if (!isJSON) {
            printJSON(validationResult)
          }

          return { exitCode: 1, result: validationResult }
        }

        const result = args.returning
          ? updateResult
          : {
              ...updateResult,
              docs: updateResult.docs.map(({ id }) => ({ id })),
            }

        if (!isJSON) {
          printJSON(result)
        }

        return { result }
      }

      throw new Error('Either id or where must be provided.')
    } catch (error) {
      const validation = getCollectionValidationResult({ slug: collection, error, req })

      if (!validation) {
        throw error
      }

      if (!isJSON) {
        printJSON(validation)
      }

      return { exitCode: 1, result: validation }
    }
  },
  helpGroup: 'Data commands',
  input: updateDocumentLocalInputSchema({ file: localFileSchema }),
})
