import type { CLICommand } from '../../config/types.js'

import { createDataCommand } from './data/createDataCommand.js'
import { printJSON } from './data/utilities.js'

export const createGetConfigInfoCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'getConfigInfo',
      description: 'Print local collection and global slugs.',
      handler({ payload }) {
        printJSON({
          collections: payload.config.collections.map(({ slug }) => slug),
          globals: payload.config.globals.map(({ slug }) => slug),
        })
        return Promise.resolve({})
      },
      options: {},
      summary: 'Print local config information',
    },
  })
