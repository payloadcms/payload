import type { Payload, SanitizedConfig } from 'payload'
import type { CLIRuntime } from 'payload/cli'

import path from 'node:path'
import payload from 'payload'
import { createProgram } from 'payload/internal'

export const runCLICommand = async ({
  argv,
  config,
  preparePayload,
}: {
  argv: string[]
  config: SanitizedConfig
  preparePayload?: ({ payload }: { payload: Payload }) => Promise<void> | void
}): Promise<void> => {
  const runtime: CLIRuntime = {
    configDir: process.env.PAYLOAD_CONFIG_PATH
      ? path.dirname(path.resolve(process.env.PAYLOAD_CONFIG_PATH))
      : process.cwd(),
    destroy: () => Promise.resolve(),
    getConfig: () => Promise.resolve(config),
    async getPayload(options = {}) {
      await payload.init({ config, ...options })
      await preparePayload?.({ payload })

      return payload
    },
    isScheduled: false,
    markScheduled: () => undefined,
  }
  const program = await createProgram(runtime)

  await program.parseAsync(argv, { from: 'user' })
}
