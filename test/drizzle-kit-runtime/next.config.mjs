import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

const root = fileURLToPath(new URL('../../', import.meta.url))

export default withPayload(
  {
    output: 'standalone',
    webpack(config) {
      config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.mjs': ['.mts', '.mjs'] }
      return config
    },
    turbopack: { root },
    outputFileTracingRoot: root,
    typescript: { ignoreBuildErrors: true },
  },
  { devBundleServerPackages: true },
)
