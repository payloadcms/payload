import { buildPluginCloudStorageIntConfig } from './buildPluginCloudStorageIntConfig.js'

/** S3 `useCompositePrefixes: true` — use with `initPayloadInt(..., 'config.compositePrefixes.ts')` for composite key tests. */
// eslint-disable-next-line no-restricted-exports
export default buildPluginCloudStorageIntConfig({ useCompositePrefixes: true })
