import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'
import { printJSON } from './data/utilities.js'

export const createGetConfigInfoCommand = defineCLICommand({
  description: 'Print local collection and global slugs.',
  handler: async ({ getPayload }) => {
    const payload = await getPayload()

    printJSON({
      collections: payload.config.collections.map(({ slug }) => slug),
      globals: payload.config.globals.map(({ slug }) => slug),
    })
  },
  helpGroup: 'Data commands',
  input: strictObject({}),
})
