import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig } from './getConfig.js'

export default buildConfigWithDefaults(getConfig(), {
  disableAutoLogin: true,
})
