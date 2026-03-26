import nextConfig from '../../../next.config.mjs'

import path from 'path'
import { fileURLToPath } from 'url'

import { serverURL } from '../../__helpers/shared/serverURL.js'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

export default {
  ...nextConfig,
  env: {
    PAYLOAD_CORE_DEV: 'true',
    ROOT_DIR: path.resolve(dirname),
    NEXT_PUBLIC_SERVER_URL: serverURL,
  },
}
