/* eslint-disable no-restricted-exports */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { config } from './config.js'

export default buildConfigWithDefaults({
  ...config,
  jobs: {
    ...config.jobs,
    scheduler: 'cron',
  },
})
