import type { CollectionTool, GlobalTool, Tool } from '../types.js'

import {
  authCollectionTool,
  forgotPasswordCollectionTool,
  loginCollectionTool,
  resetPasswordCollectionTool,
  unlockCollectionTool,
  verifyCollectionTool,
} from './builtin/collections/authTools.js'
import { createDocumentTool } from './builtin/collections/createTool.js'
import { deleteDocumentsTool } from './builtin/collections/deleteTool.js'
import { findDocumentsTool } from './builtin/collections/findTool.js'
import { getCollectionSchemaTool } from './builtin/collections/getCollectionSchemaTool.js'
import { updateDocumentTool } from './builtin/collections/updateTool.js'
import { getConfigInfoTool } from './builtin/getConfigInfoTool.js'
import { findGlobalTool } from './builtin/globals/findTool.js'
import { getGlobalSchemaTool } from './builtin/globals/getGlobalSchemaTool.js'
import { updateGlobalTool } from './builtin/globals/updateTool.js'

export const TOOL_BUILTINS = {
  getConfigInfo: { label: 'Config Info', mcpName: 'getConfigInfo', tool: getConfigInfoTool },
} satisfies Record<string, { label: string; mcpName: string; tool: Tool }>

/**
 * The static built-in collection CRUD tools. Keys here are the source of truth
 * for `MCPCollectionBuiltinName` — adding/removing an entry updates the type
 * automatically.
 */
export const COLLECTION_BUILTINS = {
  create: { mcpName: 'createDocument', tool: createDocumentTool },
  delete: { mcpName: 'deleteDocuments', tool: deleteDocumentsTool },
  find: { mcpName: 'findDocuments', tool: findDocumentsTool },
  getCollectionSchema: { mcpName: 'getCollectionSchema', tool: getCollectionSchemaTool },
  update: { mcpName: 'updateDocument', tool: updateDocumentTool },
} satisfies Record<string, { mcpName: string; tool: CollectionTool }>

/**
 * The static auth tools surfaced under auth-enabled collections. Each entry
 * carries the admin-UI label alongside the tool. Keys are the source of truth
 * for `MCPCollectionAuthToolName`.
 */
export const COLLECTION_AUTH_BUILTINS = {
  auth: { label: 'Check Auth Status', mcpName: 'auth', tool: authCollectionTool },
  forgotPassword: {
    label: 'Forgot Password',
    mcpName: 'forgotPassword',
    tool: forgotPasswordCollectionTool,
  },
  login: { label: 'User Login', mcpName: 'login', tool: loginCollectionTool },
  resetPassword: {
    label: 'Reset Password',
    mcpName: 'resetPassword',
    tool: resetPasswordCollectionTool,
  },
  unlock: { label: 'Unlock Account', mcpName: 'unlock', tool: unlockCollectionTool },
  verify: { label: 'Email Verification', mcpName: 'verify', tool: verifyCollectionTool },
} satisfies Record<string, { label: string; mcpName: string; tool: CollectionTool }>

/**
 * The static built-in global tools. Keys are the source of truth for
 * `MCPGlobalBuiltinName`.
 */
export const GLOBAL_BUILTINS = {
  find: { mcpName: 'findGlobal', tool: findGlobalTool },
  getGlobalSchema: { mcpName: 'getGlobalSchema', tool: getGlobalSchemaTool },
  update: { mcpName: 'updateGlobal', tool: updateGlobalTool },
} satisfies Record<string, { mcpName: string; tool: GlobalTool }>

export type MCPCollectionBuiltinName = keyof typeof COLLECTION_BUILTINS

export type MCPCollectionAuthToolName = keyof typeof COLLECTION_AUTH_BUILTINS

export type MCPGlobalBuiltinName = keyof typeof GLOBAL_BUILTINS

export type MCPTopLevelBuiltinName = keyof typeof TOOL_BUILTINS

/**
 * Pre-typed `Object.entries` for each registry. The cast from `string` to the
 * literal key union lives here once so consumers can iterate without their own
 * cast — TypeScript's `Object.entries` always widens keys to `string`, which
 * defeats the narrow type lookups on `MCPCollectionToolsMap`.
 */
export const TOOL_BUILTIN_ENTRIES = Object.entries(TOOL_BUILTINS) as Array<
  [MCPTopLevelBuiltinName, (typeof TOOL_BUILTINS)[MCPTopLevelBuiltinName]]
>

export const COLLECTION_BUILTIN_ENTRIES = Object.entries(COLLECTION_BUILTINS) as Array<
  [MCPCollectionBuiltinName, (typeof COLLECTION_BUILTINS)[MCPCollectionBuiltinName]]
>

export const COLLECTION_AUTH_BUILTIN_ENTRIES = Object.entries(COLLECTION_AUTH_BUILTINS) as Array<
  [MCPCollectionAuthToolName, (typeof COLLECTION_AUTH_BUILTINS)[MCPCollectionAuthToolName]]
>

export const GLOBAL_BUILTIN_ENTRIES = Object.entries(GLOBAL_BUILTINS) as Array<
  [MCPGlobalBuiltinName, (typeof GLOBAL_BUILTINS)[MCPGlobalBuiltinName]]
>
