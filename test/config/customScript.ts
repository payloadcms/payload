import { writeFileSync } from 'fs'
import { defineCLICommand, z } from 'payload/cli'

import { testFilePath } from './testFilePath.js'

export const createStartServerCommand = defineCLICommand({
  description: 'Write the current users to the CLI test file.',
  handler: async ({ getPayload }) => {
    const payload = await getPayload()
    const data = await payload.find({ collection: 'users' })

    writeFileSync(testFilePath, JSON.stringify(data), 'utf-8')
  },
  input: z.strictObject({}),
})

// eslint-disable-next-line no-restricted-exports
export default createStartServerCommand
