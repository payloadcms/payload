import type { CollectionTool, GlobalTool } from '../types.js'

import {
  authCollectionTool,
  forgotPasswordCollectionTool,
  loginCollectionTool,
  resetPasswordCollectionTool,
  unlockCollectionTool,
  verifyCollectionTool,
} from './builtin/collections/authTools.js'
import { createCollectionTool } from './builtin/collections/createTool.js'
import { deleteCollectionTool } from './builtin/collections/deleteTool.js'
import { findCollectionTool } from './builtin/collections/findTool.js'
import { updateCollectionTool } from './builtin/collections/updateTool.js'
import { findGlobalTool } from './builtin/globals/findTool.js'
import { updateGlobalTool } from './builtin/globals/updateTool.js'

/**
 * The static built-in collection CRUD tools. Keys here are the source of truth
 * for `MCPCollectionBuiltinName` — adding/removing an entry updates the type
 * automatically.
 */
export const COLLECTION_BUILTINS: Record<MCPCollectionBuiltinName, CollectionTool> = {
  create: createCollectionTool,
  delete: deleteCollectionTool,
  find: findCollectionTool,
  update: updateCollectionTool,
}

/**
 * The static auth tools surfaced under auth-enabled collections. Each entry
 * carries the admin-UI label alongside the tool. Keys are the source of truth
 * for `MCPCollectionAuthToolName`.
 */
export const COLLECTION_AUTH_BUILTINS: Record<
  MCPCollectionAuthToolName,
  { label: string; tool: CollectionTool }
> = {
  auth: { label: 'Check Auth Status', tool: authCollectionTool },
  forgotPassword: { label: 'Forgot Password', tool: forgotPasswordCollectionTool },
  login: { label: 'User Login', tool: loginCollectionTool },
  resetPassword: { label: 'Reset Password', tool: resetPasswordCollectionTool },
  unlock: { label: 'Unlock Account', tool: unlockCollectionTool },
  verify: { label: 'Email Verification', tool: verifyCollectionTool },
}

/**
 * The static built-in global tools. Keys are the source of truth for
 * `MCPGlobalBuiltinName`.
 */
export const GLOBAL_BUILTINS: Record<MCPGlobalBuiltinName, GlobalTool> = {
  find: findGlobalTool,
  update: updateGlobalTool,
}

export type MCPCollectionBuiltinName = 'create' | 'delete' | 'find' | 'update'

export type MCPCollectionAuthToolName =
  | 'auth'
  | 'forgotPassword'
  | 'login'
  | 'resetPassword'
  | 'unlock'
  | 'verify'

export type MCPGlobalBuiltinName = 'find' | 'update'

/**
 * Pre-typed `Object.entries` for each registry. The cast from `string` to the
 * literal key union lives here once so consumers can iterate without their own
 * cast — TypeScript's `Object.entries` always widens keys to `string`, which
 * defeats the narrow type lookups on `MCPCollectionToolsMap`.
 */
export const COLLECTION_BUILTIN_ENTRIES = Object.entries(COLLECTION_BUILTINS) as Array<
  [MCPCollectionBuiltinName, CollectionTool]
>

export const COLLECTION_AUTH_BUILTIN_ENTRIES = Object.entries(COLLECTION_AUTH_BUILTINS) as Array<
  [MCPCollectionAuthToolName, { label: string; tool: CollectionTool }]
>

export const GLOBAL_BUILTIN_ENTRIES = Object.entries(GLOBAL_BUILTINS) as Array<
  [MCPGlobalBuiltinName, GlobalTool]
>
