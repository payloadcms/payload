export { buildConfig } from '../config/build.js'
export * from '../config/types.js'

export type { FieldTypes } from '../admin/forms/FieldTypes.js'
export { defaults as collectionDefaults } from '../collections/config/defaults.js'
export {
  createClientCollectionConfig,
  createClientConfig,
  createClientGlobalConfig,
} from '../config/createClientConfig.js'
export { defaults } from '../config/defaults.js'
export { sanitizeConfig } from '../config/sanitize.js'
export { baseBlockFields } from '../fields/baseFields/baseBlockFields.js'
export { baseIDField } from '../fields/baseFields/baseIDField.js'
export { sanitizeFields } from '../fields/config/sanitize.js'
