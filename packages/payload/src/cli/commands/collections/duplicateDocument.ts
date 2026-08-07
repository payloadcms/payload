import * as z from 'zod/mini'

import type { PopulateType, SelectType } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  dataSchema,
  depthSchema,
  fallbackLocaleSchema,
  idSchema,
  localeSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  parseSelectedLocales,
  populateSchema,
  selectedLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  writeDraftSchema,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createDuplicateDocumentCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    selectedLocales: { flags: '--selected-locales <locale>', parse: parseSelectedLocales },
  },
  description: 'Duplicate a document in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const collection = args.slug
    const result = await payload.duplicate({
      id: args.id,
      collection,
      data: args.data ? prepareCollectionData({ collection, data: args.data, payload }) : undefined,
      depth: args.depth,
      draft: args.draft,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: true,
      populate: args.populate as PopulateType | undefined,
      select: args.select as SelectType | undefined,
      selectedLocales: args.selectedLocales,
      showHiddenFields: args.showHiddenFields,
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: strictObject({
    id: idSchema,
    slug: collectionSlugSchema,
    data: z.optional(dataSchema),
    depth: depthSchema,
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    populate: populateSchema,
    select: selectSchema,
    selectedLocales: selectedLocalesSchema,
    showHiddenFields: showHiddenFieldsSchema,
  }),
})
