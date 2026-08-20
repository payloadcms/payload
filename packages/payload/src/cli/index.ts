import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import { createCLIHelp } from './program/createHelp.js'
import { createRootProgram } from './program/createRootProgram.js'
import { loadCLICommands, validateCLICommandNames } from './program/loadCommands.js'
import { registerCLICommand } from './program/registerCommand.js'
import { createCLIRuntime } from './runtime/createRuntime.js'
import { loadEnv } from './runtime/loadEnv.js'
import { withErrorHandling } from './runtime/output.js'

configureZod(en())

export const bin = async (): Promise<void> => {
  // /////////////////////////////////////
  // Setup environment
  // /////////////////////////////////////
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const runtime = createCLIRuntime()

  await withErrorHandling({
    run: async () => {
      // /////////////////////////////////////
      // Create CLI program
      // /////////////////////////////////////
      const program = createRootProgram()
      const commands = await loadCLICommands({ runtime })

      validateCLICommandNames({ commands })

      const help = createCLIHelp({ commands, program })

      // /////////////////////////////////////
      // Register commands
      // /////////////////////////////////////

      for (const { name, definition } of commands) {
        registerCLICommand({
          name,
          definition,
          help,
          program,
          runtime,
        })
      }

      // /////////////////////////////////////
      // Output help if requested
      // /////////////////////////////////////
      if (process.argv.length === 2) {
        program.outputHelp()
        return
      }

      // /////////////////////////////////////
      // Run the program with the provided arguments
      // /////////////////////////////////////
      await program.parseAsync(process.argv)
    },
    runtime,
  })
}
