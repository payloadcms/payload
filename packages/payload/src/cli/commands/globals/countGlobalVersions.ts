import type { Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { globalSlugSchema, localeSchema, parseJSON, whereSchema } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createCountGlobalVersionsCommand = defineCLICommand({
  cli: {
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Count versions of a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.countGlobalVersions({
      global: args.slug,
      locale: args.locale,
      overrideAccess: true,
      where: args.where as undefined | Where,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: globalSlugSchema,
    locale: localeSchema,
    where: whereSchema,
  }),
})
