/* eslint-disable no-restricted-exports */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

const config = getConfig()

export default buildConfigWithDefaults({
  ...config,
  jobs: {
    ...config.jobs,
    scheduler: 'cron',
  },
})
