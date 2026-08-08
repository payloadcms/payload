import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { build } from './build.js'

export const createBuildCommand = defineCLICommand({
  handler: async ({ args, getConfig }) => {
    await build({
      config: await getConfig(),
      forwardedArgs: args.frameworkArgs,
      skipTypes: !args.types,
    })
  },
  allowUnknownOption: true,
  cli: {
    frameworkArgs: 'argument',
  },
  description: 'Prepare Payload and run the detected framework build.',
  helpGroup: 'Core commands',
  input: strictObject({
    frameworkArgs: z
      ._default(z.array(z.string()), [])
      .check(z.describe('Arguments forwarded to the detected framework build.')),
    types: z
      ._default(z.boolean(), true)
      .check(z.describe('Generate Payload types before building.')),
  }),
  name: 'build',
})
