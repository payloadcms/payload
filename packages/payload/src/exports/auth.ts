export * from '../auth/index.js'
export { default as executeAccess } from '../auth/executeAccess.js'
export { getAccessResults } from '../auth/getAccessResults.js'
export { getAuthenticatedUser } from '../auth/getAuthenticatedUser.js'

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
} from '../auth/types.d.ts'
