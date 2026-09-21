import { buildPluginCloudStorageIntConfig } from './buildPluginCloudStorageIntConfig.js'

/** S3 `useCompositePrefixes: true` variant for the composite-key integration tests. */
// eslint-disable-next-line no-restricted-exports
export default buildPluginCloudStorageIntConfig({ useCompositePrefixes: true })
