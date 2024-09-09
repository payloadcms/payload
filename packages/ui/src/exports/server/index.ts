// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { createClientCollectionConfig } from '../../providers/Config/createClientConfig/collections.js'

export {
  createClientField,
  createClientFields,
} from '../../providers/Config/createClientConfig/fields.js'

export { createClientGlobalConfig } from '../../providers/Config/createClientConfig/globals.js'

export { createClientConfig } from '../../providers/Config/createClientConfig/index.js'
