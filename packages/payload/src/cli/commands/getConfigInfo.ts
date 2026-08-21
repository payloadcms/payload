import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'
import { printJSON } from './data/utilities.js'

export const createGetConfigInfoCommand = defineCLICommand({
  description: 'Print local collection and global slugs.',
  handler: async ({ getPayload, isJSON }) => {
    const payload = await getPayload()

    const result = {
      collections: payload.config.collections.map(({ slug }) => slug),
      globals: payload.config.globals.map(({ slug }) => slug),
    }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({}),
})
