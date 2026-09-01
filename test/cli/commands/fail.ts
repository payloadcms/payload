import { strictObject } from 'payload'
import { defineCLICommand } from 'payload/cli'

export const createFailCommand = defineCLICommand({
  description: 'Log a diagnostic and fail.',
  handler: () => {
    console.log('Preparing to fail.')

    throw Object.assign(new Error('Expected CLI failure.'), { code: 'EXPECTED_FAILURE' })
  },
  input: strictObject({}),
})
