import nextConfig from '../../next.config.mjs'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

console.log({ root_dir: dirname })
export default {
  ...nextConfig,
  env: {
    PAYLOAD_CORE_DEV: 'true',
    ROOT_DIR: path.resolve(dirname),
  },
}
