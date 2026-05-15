export const HARD_EXCLUDED_COLLECTION_SLUGS: string[] = ['payload-mcp-api-keys']

export const COLLECTION_BUILTIN_TOOL_KEYS: string[] = ['create', 'delete', 'find', 'update']
export type CollectionBuiltinToolKey = 'create' | 'delete' | 'find' | 'update'

export const COLLECTION_BUILTIN_AUTH_TOOL_KEYS: string[] = [
  'login',
  'verify',
  'resetPassword',
  'forgotPassword',
  'unlock',
  'auth',
]

export type CollectionBuiltinAuthToolKey =
  | 'auth'
  | 'forgotPassword'
  | 'login'
  | 'resetPassword'
  | 'unlock'
  | 'verify'

export const GLOBAL_BUILTIN_TOOL_KEYS: string[] = ['find', 'update']
