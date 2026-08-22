import * as z from 'zod/mini'

import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

export const createGenerateDBSchemaCommand = defineCLICommand({
  description: 'Generate the database adapter schema.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload({
      disableDBConnect: true,
      disableOnInit: true,
    })

    if (typeof payload.db.generateSchema !== 'function') {
      throw new Error(`${payload.db.packageName} does not support database schema generation`)
    }

    await payload.db.generateSchema({ ...args, log: isJSON ? false : args.log })
  },
  helpGroup: 'Core commands',
  input: strictObject({
    log: z._default(z.boolean(), true).check(z.describe('Log the generated schema.')),
    prettify: z._default(z.boolean(), true).check(z.describe('Prettify the generated schema.')),
  }),
})
