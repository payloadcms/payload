import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

const root = fileURLToPath(new URL('../../', import.meta.url))

export default withPayload(
  {
    output: 'standalone',
    turbopack: { root },
    outputFileTracingRoot: root,
    typescript: { ignoreBuildErrors: true },
  },
  { devBundleServerPackages: true },
)
