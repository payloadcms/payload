import type { WorkflowConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const externalWorkflow: WorkflowConfig<'externalWorkflow'> = {
  slug: 'externalWorkflow',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: path.resolve(dirname, '../runners/externalWorkflow.ts') + '#externalWorkflowHandler',
}
