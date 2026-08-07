import { z } from 'zod'

import type { Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import {
  collectionSlugSchema,
  localeSchema,
  parseJSON,
  trashSchema,
  whereSchema,
} from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createCountDocumentsCommand = defineCLICommand({
  name: 'countDocuments',
  cli: {
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Count documents in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.count({
      collection: args.slug,
      locale: args.locale,
      overrideAccess: true,
      trash: args.trash,
      where: args.where as undefined | Where,
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: z.strictObject({
    slug: collectionSlugSchema,
    locale: localeSchema,
    trash: trashSchema,
    where: whereSchema,
  }),
})
