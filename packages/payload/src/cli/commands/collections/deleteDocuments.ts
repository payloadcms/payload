import * as z from 'zod/mini'

import type { Payload, Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  depthSchema,
  fallbackLocaleSchema,
  idSchema,
  localeSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  whereSchema,
} from '../data/input.js'
import { printJSON, requireIDOrWhere } from '../data/utilities.js'

const input = strictObject(
  {
    id: z.optional(idSchema),
    slug: collectionSlugSchema,
    depth: depthSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    where: whereSchema,
  },
  z.superRefine(requireIDOrWhere),
)

export const createDeleteDocumentsCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Delete documents from a local collection by ID or where query.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.delete({
      id: args.id,
      collection: args.slug,
      depth: args.depth,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: true,
      where: args.where as undefined | Where,
    } as Parameters<Payload['delete']>[0])

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input,
})
