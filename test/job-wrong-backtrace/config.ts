import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { throwFromTaskHandlerTask } from './throwFromTaskHandler.js'
import { throwFromWorkflowHandlerWorkflow } from './throwFromWorkflowHandler.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  jobs: {
    deleteJobOnComplete: false,
    shouldAutoRun: () => false,
    tasks: [throwFromTaskHandlerTask],
    workflows: [throwFromWorkflowHandlerWorkflow],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
