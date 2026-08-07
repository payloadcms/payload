import { z } from 'zod'

import type { Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { collectionSlugSchema, localeSchema, parseJSON, whereSchema } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createCountVersionsCommand = defineCLICommand({
  name: 'countVersions',
  cli: {
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Count document versions in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.countVersions({
      collection: args.slug,
      locale: args.locale,
      overrideAccess: true,
      where: args.where as undefined | Where,
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: z.strictObject({
    slug: collectionSlugSchema,
    locale: localeSchema,
    where: whereSchema,
  }),
})
