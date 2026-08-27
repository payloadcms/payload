import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { generateImportMap } from './generateImportMap.js'

export const createGenerateImportMapCommand = defineCLICommand({
  description: 'Generate the admin import map.',
  handler: async ({ getConfig, isJSON }) => {
    const result = await generateImportMap(await getConfig(), { log: !isJSON })

    return result ? { result } : undefined
  },
  helpGroup: 'Core commands',
  input: strictObject({}),
})
