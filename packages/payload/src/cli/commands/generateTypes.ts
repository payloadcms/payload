import { defineCLICommand } from '../defineCLICommand.js'
import { generateTypes } from '../generateTypes.js'
import { strictObject } from '../zod.js'

export const createGenerateTypesCommand = defineCLICommand({
  description: 'Generate TypeScript types from the Payload config.',
  handler: async ({ getConfig }) => {
    await generateTypes(await getConfig())
  },
  helpGroup: 'Core commands',
  input: strictObject({}),
})
