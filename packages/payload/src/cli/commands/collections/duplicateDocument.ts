import { duplicateDocumentLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { parseDocumentID } from '../../../utilities/parseDocumentID.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  parseBoolean,
  parseFallbackLocale,
  parseJSON,
  parseSelectedLocales,
} from '../data/input.js'
import {
  getCollectionValidationResult,
  prepareCollectionData,
  printJSON,
  stripCollectionVirtualFields,
  validateCollectionData,
} from '../data/utilities.js'

export const createDuplicateDocumentCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    selectedLocales: { flags: '--selected-locales <locale>', parse: parseSelectedLocales },
  },
  description: 'Duplicate a document in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const inputData = args.data
      ? stripCollectionVirtualFields({ collection, data: args.data, payload })
      : undefined
    const req = await createLocalReq({}, payload)
    let result

    try {
      if (inputData) {
        validateCollectionData({
          slug: collection,
          data: inputData,
          partial: true,
          req,
        })
      }

      result = await payload.duplicate({
        id: parseDocumentID({ id: args.id, collectionSlug: collection, payload }),
        collection,
        data: inputData
          ? prepareCollectionData({ collection, data: inputData, payload })
          : undefined,
        depth: args.depth,
        draft: args.draft,
        fallbackLocale: args.fallbackLocale,
        locale: args.locale,
        overrideAccess: args.overrideAccess,
        populate: args.populate,
        select: args.select,
        selectedLocales: args.selectedLocales,
        showHiddenFields: args.showHiddenFields,
      })
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

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: duplicateDocumentLocalInputSchema,
})
