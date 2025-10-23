/* eslint-disable no-restricted-exports */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'
import { EverySecondMax2Task } from './tasks/EverySecondMax2Task.js'
import { EverySecondTask } from './tasks/EverySecondTask.js'

const config = getConfig()

export default buildConfigWithDefaults({
  ...config,
  jobs: {
    ...config.jobs,
    tasks: [...(config?.jobs?.tasks || []), EverySecondTask, EverySecondMax2Task],
    autoRun: [
      {
        // @ts-expect-error not undefined
        ...config.jobs.autoRun[0],
        disableScheduling: false,
      },
    ],
  },
})
