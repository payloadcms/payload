export * from '../auth/index.js'
export { default as executeAccess } from '../auth/executeAccess.js'
export { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
export { getAccessResults } from '../auth/getAccessResults.js'
export { getFieldsToSign } from '../auth/getFieldsToSign.js'

export type {
  AuthStrategyFunction,
  AuthStrategyFunctionArgs,
  CollectionPermission,
  FieldPermissions,
  GlobalPermission,
  IncomingAuthType,
  Permission,
  Permissions,
  User,
  VerifyConfig,
} from '../auth/types.js'
