import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig, seed } from './getConfig.js'

export default buildConfigWithDefaults({ suite: 'database', config: getConfig(), seed })
