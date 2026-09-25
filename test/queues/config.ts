import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { getConfig, seed } from './getConfig.js'

export default buildConfigWithDefaults({ suite: 'queues', config: getConfig(), seed })
