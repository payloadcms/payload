import nextConfig from '../../next.config.mjs'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

process.env.NEXT_TRAILING_SLASH = 'true'

export default {
  ...nextConfig,
  trailingSlash: true,
  env: {
    ...nextConfig.env,
    PAYLOAD_CORE_DEV: 'true',
    ROOT_DIR: path.resolve(dirname),
    NEXT_TRAILING_SLASH: 'true',
  },
}
