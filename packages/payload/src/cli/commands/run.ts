import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as z from 'zod/mini'

import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

export const createRunCommand = defineCLICommand({
  allowUnknownOption: true,
  cli: {
    scriptArgs: { type: 'argument', position: 1 },
    scriptPath: { type: 'argument', position: 0 },
  },
  description: 'Run a local script in the Payload environment.',
  handler: async ({ args }) => {
    const absoluteScriptPath = path.resolve(process.cwd(), args.scriptPath)
    const originalArgv = process.argv

    // Make the imported module receive arguments as if it were run directly with Node.
    // For example, `[node, payload, run, script.ts, first]` becomes `[node, script.ts, first]`.
    process.argv = [process.execPath, absoluteScriptPath, ...args.scriptArgs]

    try {
      await import(pathToFileURL(absoluteScriptPath).toString())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      throw new Error(`Error running script ${absoluteScriptPath}: ${message}`)
    } finally {
      process.argv = originalArgv
    }
  },
  helpGroup: 'Core commands',
  input: strictObject({
    scriptArgs: z
      ._default(z.array(z.string()), [])
      .check(z.describe('Arguments passed to the script.')),
    scriptPath: z.string().check(z.minLength(1), z.describe('Path to the local script.')),
  }),
})
