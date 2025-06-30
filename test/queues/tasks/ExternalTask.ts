import type { TaskConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const ExternalTask: TaskConfig<'ExternalTask'> = {
  retries: 2,
  slug: 'ExternalTask',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'simpleID',
      type: 'text',
      required: true,
    },
  ],
  handler: path.resolve(dirname, '../runners/externalTask.ts') + '#externalTaskHandler',
}
