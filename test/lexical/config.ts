import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './baseConfig.js'

export default buildConfigWithDefaults({ suite: 'lexical', config: baseConfig, seed })
