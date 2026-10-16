import path from 'path'
import { fileURLToPath } from 'url'

import { withPayload } from '../../packages/next/src/withPayload/withPayload.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default withPayload({
  env: {
    PAYLOAD_CORE_DEV: 'true',
    ROOT_DIR: path.resolve(dirname),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
})
