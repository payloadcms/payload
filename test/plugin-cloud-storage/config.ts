import { buildPluginCloudStorageIntConfig } from './buildPluginCloudStorageIntConfig.js'

/** Default integration config: S3 `useCompositePrefixes: false` (non-composite prefix + URL behavior). */
export default buildPluginCloudStorageIntConfig({ useCompositePrefixes: false })
