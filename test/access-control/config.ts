import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig, seed } from './getConfig.js'

export default buildConfigWithDefaults({
  suite: 'access-control',
  config: getConfig(),
  seed,
  disableAutoLogin: true,
})
