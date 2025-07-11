/* eslint-disable no-restricted-exports */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

const config = getConfig()

export default buildConfigWithDefaults({
  ...config,
  jobs: {
    ...config.jobs,
    autoRun: [
      {
        // @ts-expect-error not undefined
        ...config.jobs.autoRun[0],
        disableScheduling: false,
      },
    ],
  },
})
