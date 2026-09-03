import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './config.base.js'

export default buildConfigWithDefaults({ suite: 'plugin-multi-tenant', config: baseConfig, seed })
