import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './baseConfig.js'

export default buildConfigWithDefaults({ suite: 'fields', config: baseConfig, seed })

export { collections } from './baseConfig.js'
