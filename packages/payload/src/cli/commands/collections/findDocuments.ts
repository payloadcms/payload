import * as z from 'zod/mini'

import type { JoinQuery, Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  defaultLimitSchema,
  defaultPageSchema,
  depthSchema,
  draftSchema,
  fallbackLocaleSchema,
  idSchema,
  joinsSchema,
  localeSchema,
  paginationSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  parseSort,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
  sortSchema,
  trashSchema,
  whereSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindDocumentsCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    joins: { flags: '--joins <json|@file>', parse: parseJSON },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find documents in a local collection, or find one document by ID.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const commonOptions = getReadOptions(args)
    const result =
      args.id !== undefined
        ? await payload.findByID({
            id: args.id,
            collection,
            ...commonOptions,
            draft: args.draft,
            joins: args.joins as false | JoinQuery | undefined,
            trash: args.trash,
          })
        : await payload.find({
            collection,
            ...commonOptions,
            draft: args.draft,
            joins: args.joins as false | JoinQuery | undefined,
            limit: args.limit,
            page: args.page,
            pagination: args.pagination,
            sort: args.sort,
            trash: args.trash,
            where: args.where as undefined | Where,
          })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    id: z.optional(idSchema),
    slug: collectionSlugSchema,
    depth: depthSchema,
    draft: draftSchema,
    fallbackLocale: fallbackLocaleSchema,
    joins: joinsSchema,
    limit: defaultLimitSchema,
    locale: localeSchema,
    page: defaultPageSchema,
    pagination: paginationSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    sort: sortSchema,
    trash: trashSchema,
    where: whereSchema,
  }),
})
