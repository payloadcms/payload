import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { configMarker } from './configMarker.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    custom: {
      configMarker,
    },
    endpoints: [
      {
        handler: (req) => Response.json({ configMarker: req.payload.config.custom.configMarker }),
        method: 'get',
        path: '/config-marker',
      },
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  suite: 'dev-config-reload',
})
