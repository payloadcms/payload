import nextConfig from '../../next.config.mjs'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

export default {
  ...nextConfig,
  env: {
    NEXT_PUBLIC_PAYLOAD_CORE_DEV: 'true',
    NEXT_PUBLIC_ROOT_DIR: path.resolve(dirname),
  }
}
