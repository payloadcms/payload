import type { CLICommand } from '../../../config/types.js'

import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getGlobalInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { createDataCommand } from '../data/createDataCommand.js'
import { globalSlugOption } from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createGetGlobalSchemaCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'getGlobalSchema',
      description: 'Print the writable JSON schema for a local global.',
      async handler({ options, payload }) {
        const globalSlug = options.slug
        const req = await createLocalReq({}, payload)
        const schema = getGlobalInputSchema({ globalSlug, req })

        if (!schema) {
          throw new Error(`Global "${globalSlug}" not found.`)
        }

        printJSON({ globalSlug, schema })
        return {}
      },
      options: { slug: globalSlugOption },
      summary: 'Print a global input schema',
    },
  })
