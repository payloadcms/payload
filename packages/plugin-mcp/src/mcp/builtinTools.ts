import type { CollectionTool, GlobalTool, Tool } from '../types.js'

import {
  authCollectionTool,
  forgotPasswordCollectionTool,
  loginCollectionTool,
  resetPasswordCollectionTool,
  unlockCollectionTool,
  verifyCollectionTool,
} from './builtin/collections/authTools.js'
import { countDocumentsTool } from './builtin/collections/countTool.js'
import { countVersionsTool } from './builtin/collections/countVersionsTool.js'
import { createDocumentTool } from './builtin/collections/createTool.js'
import { deleteDocumentsTool } from './builtin/collections/deleteTool.js'
import { duplicateDocumentTool } from './builtin/collections/duplicateTool.js'
import { findDistinctTool } from './builtin/collections/findDistinctTool.js'
import { findDocumentsTool } from './builtin/collections/findTool.js'
import { findVersionByIDTool } from './builtin/collections/findVersionByIDTool.js'
import { findVersionsTool } from './builtin/collections/findVersionsTool.js'
import { getCollectionSchemaTool } from './builtin/collections/getCollectionSchemaTool.js'
import { restoreVersionTool } from './builtin/collections/restoreVersionTool.js'
import { updateDocumentTool } from './builtin/collections/updateTool.js'
import { getUploadInstructionsTool } from './builtin/collections/uploadInstructionsTool.js'
import { getConfigInfoTool } from './builtin/getConfigInfoTool.js'
import { countGlobalVersionsTool } from './builtin/globals/countVersionsTool.js'
import { findGlobalTool } from './builtin/globals/findTool.js'
import { findGlobalVersionByIDTool } from './builtin/globals/findVersionByIDTool.js'
import { findGlobalVersionsTool } from './builtin/globals/findVersionsTool.js'
import { getGlobalSchemaTool } from './builtin/globals/getGlobalSchemaTool.js'
import { restoreGlobalVersionTool } from './builtin/globals/restoreVersionTool.js'
import { updateGlobalTool } from './builtin/globals/updateTool.js'

type CollectionBuiltin = {
  mcpName: string
  requiresDuplicateEnabled?: boolean
  requiresUpload?: boolean
  requiresVersions?: boolean
  tool: CollectionTool
}

type GlobalBuiltin = {
  mcpName: string
  requiresVersions?: boolean
  tool: GlobalTool
}

export const TOOL_BUILTINS = {
  getConfigInfo: { mcpName: 'getConfigInfo', tool: getConfigInfoTool },
} satisfies Record<string, { mcpName: string; tool: Tool }>

/**
 * The static built-in collection CRUD tools. Keys here are the source of truth
 * for `MCPCollectionBuiltinName` — adding/removing an entry updates the type
 * automatically.
 */
export const COLLECTION_BUILTINS = {
  count: { mcpName: 'countDocuments', tool: countDocumentsTool },
  countVersions: { mcpName: 'countVersions', requiresVersions: true, tool: countVersionsTool },
  create: { mcpName: 'createDocument', tool: createDocumentTool },
  delete: { mcpName: 'deleteDocuments', tool: deleteDocumentsTool },
  duplicate: {
    mcpName: 'duplicateDocument',
    requiresDuplicateEnabled: true,
    tool: duplicateDocumentTool,
  },
  find: { mcpName: 'findDocuments', tool: findDocumentsTool },
  findDistinct: { mcpName: 'findDistinct', tool: findDistinctTool },
  findVersionByID: {
    mcpName: 'findVersionByID',
    requiresVersions: true,
    tool: findVersionByIDTool,
  },
  findVersions: { mcpName: 'findVersions', requiresVersions: true, tool: findVersionsTool },
  getCollectionSchema: { mcpName: 'getCollectionSchema', tool: getCollectionSchemaTool },
  getUploadInstructions: {
    mcpName: 'getUploadInstructions',
    requiresUpload: true,
    tool: getUploadInstructionsTool,
  },
  restoreVersion: { mcpName: 'restoreVersion', requiresVersions: true, tool: restoreVersionTool },
  update: { mcpName: 'updateDocument', tool: updateDocumentTool },
} satisfies Record<string, CollectionBuiltin>

/**
 * The static auth tools surfaced under auth-enabled collections. Keys are the
 * source of truth for `MCPCollectionAuthToolName`.
 */
export const COLLECTION_AUTH_BUILTINS = {
  auth: { mcpName: 'auth', tool: authCollectionTool },
  forgotPassword: {
    mcpName: 'forgotPassword',
    tool: forgotPasswordCollectionTool,
  },
  login: { mcpName: 'login', tool: loginCollectionTool },
  resetPassword: {
    mcpName: 'resetPassword',
    tool: resetPasswordCollectionTool,
  },
  unlock: { mcpName: 'unlock', tool: unlockCollectionTool },
  verify: { mcpName: 'verify', tool: verifyCollectionTool },
} satisfies Record<string, { mcpName: string; tool: CollectionTool }>

/**
 * The static built-in global tools. Keys are the source of truth for
 * `MCPGlobalBuiltinName`.
 */
export const GLOBAL_BUILTINS = {
  countGlobalVersions: {
    mcpName: 'countGlobalVersions',
    requiresVersions: true,
    tool: countGlobalVersionsTool,
  },
  find: { mcpName: 'findGlobal', tool: findGlobalTool },
  findGlobalVersionByID: {
    mcpName: 'findGlobalVersionByID',
    requiresVersions: true,
    tool: findGlobalVersionByIDTool,
  },
  findGlobalVersions: {
    mcpName: 'findGlobalVersions',
    requiresVersions: true,
    tool: findGlobalVersionsTool,
  },
  getGlobalSchema: { mcpName: 'getGlobalSchema', tool: getGlobalSchemaTool },
  restoreGlobalVersion: {
    mcpName: 'restoreGlobalVersion',
    requiresVersions: true,
    tool: restoreGlobalVersionTool,
  },
  update: { mcpName: 'updateGlobal', tool: updateGlobalTool },
} satisfies Record<string, GlobalBuiltin>

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
  [MCPCollectionBuiltinName, CollectionBuiltin]
>

export const COLLECTION_AUTH_BUILTIN_ENTRIES = Object.entries(COLLECTION_AUTH_BUILTINS) as Array<
  [MCPCollectionAuthToolName, (typeof COLLECTION_AUTH_BUILTINS)[MCPCollectionAuthToolName]]
>

export const GLOBAL_BUILTIN_ENTRIES = Object.entries(GLOBAL_BUILTINS) as Array<
  [MCPGlobalBuiltinName, GlobalBuiltin]
>
