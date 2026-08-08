import { defineCLICommand } from '../defineCLICommand.js'
import { generateImportMap } from '../generateImportMap/index.js'
import { strictObject } from '../zod.js'

export const createGenerateImportMapCommand = defineCLICommand({
  description: 'Generate the admin import map.',
  handler: async ({ getConfig }) => {
    await generateImportMap(await getConfig())
  },
  helpGroup: 'Core commands',
  input: strictObject({}),
})
