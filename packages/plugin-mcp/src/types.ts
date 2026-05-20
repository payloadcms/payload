import type {
  JsonSchemaType,
  McpServer,
  ResourceTemplate,
  ServerContext,
} from '@modelcontextprotocol/server'
import type {
  AuthCollectionSlug,
  CollectionConfig,
  CollectionSlug,
  DefaultDocumentIDType,
  GlobalSlug,
  MaybePromise,
  PayloadRequest,
  TypedUser,
} from 'payload'

import type {
  MCPCollectionAuthToolName,
  MCPCollectionBuiltinName,
  MCPGlobalBuiltinName,
} from './mcp/builtinTools.js'

export type { MCPCollectionAuthToolName, MCPCollectionBuiltinName, MCPGlobalBuiltinName }

/** Re-exported from `@modelcontextprotocol/server` — the JSON Schema shape the MCP runtime validates against. */
export type { JsonSchemaType }

/**
 * Serializable mirror of `SanitizedMCPPluginConfig` for client components —
 * the full sanitized config carries functions (tool handlers, etc.) that can't
 * cross the server→client boundary. Built by `sanitizeClientPluginConfig` and
 * passed to the `AccessField` component via `clientProps`.
 *
 * @internal
 */
export type ClientMCPPluginConfig = {
  items: Array<{
    collectionSlug?: string
    description: string
    globalSlug?: string
    key: string
    label: string
    type: 'collectionTool' | 'globalTool' | 'prompt' | 'resource' | 'tool'
  }>
}

export type MCPToolResponse = {
  content: Array<{ text: string; type: 'text' }>
  /**
   * If available, return the document fetched within the
   * mcp tool. This is threaded as an additional argument to
   * overrideResponse functions
   */
  doc?: Record<string, unknown>
}

export type MCPResponseOverride = (
  response: MCPToolResponse,
  doc: Record<string, unknown>,
  req: PayloadRequest,
) => MCPToolResponse

export type ToolHandlerArgs = {
  authorizedMCP: AuthorizedMCP
  input: Record<string, unknown>
  req: PayloadRequest
  serverContext: ServerContext
}

export type CollectionToolHandlerArgs = { collectionSlug: CollectionSlug } & ToolHandlerArgs

export type GlobalToolHandlerArgs = { globalSlug: GlobalSlug } & ToolHandlerArgs

export type Tool = {
  description: string
  handler: (args: ToolHandlerArgs) => MaybePromise<MCPToolResponse>
  input?: JsonSchemaType
  /**
   * Override the return value of the tool handler
   */
  overrideResponse?: MCPResponseOverride
}

export type CollectionTool = {
  handler: (args: CollectionToolHandlerArgs) => MaybePromise<MCPToolResponse>
  input?: ((args: { collectionSchema: JsonSchemaType }) => JsonSchemaType) | JsonSchemaType
} & Pick<Tool, 'description' | 'overrideResponse'>

export type GlobalTool = {
  handler: (args: GlobalToolHandlerArgs) => MaybePromise<MCPToolResponse>
  input?: ((args: { globalSchema: JsonSchemaType }) => JsonSchemaType) | JsonSchemaType
} & Pick<Tool, 'description' | 'overrideResponse'>

/**
 * Configures (or disables) a built-in tool without replacing it.
 * `handler?: never` prevents a full `CollectionTool`/`GlobalTool` (which has a
 * required handler) from being silently accepted at a built-in key slot.
 */
export type MCPBuiltInToolOverride = {
  description?: string
  handler?: never
  overrideResponse?: MCPResponseOverride
}

/**
 * Value at a custom (non-built-in) tool key. Either the tool itself, or `false`
 * to disable it (useful when one plugin defines a custom tool and another
 * wants to opt out per-collection).
 */
export type MCPTopLevelToolEntry = Tool

export type MCPCollectionToolsMap = {
  [customToolName: string]: boolean | CollectionTool | MCPBuiltInToolOverride | undefined
} & {
  [K in MCPCollectionBuiltinName]?: false | MCPBuiltInToolOverride
}

export type MCPAuthCollectionToolsMap = {
  [K in MCPCollectionAuthToolName]?: MCPBuiltInToolOverride | true
} & MCPCollectionToolsMap

/** Auth-enabled collections get auth-tool name autocomplete; others get CRUD-only. */
export type MCPToolsMapForCollection<Slug extends CollectionSlug> = Slug extends AuthCollectionSlug
  ? MCPAuthCollectionToolsMap
  : MCPCollectionToolsMap

export type MCPGlobalToolsMap = {
  [customToolName: string]: boolean | GlobalTool | MCPBuiltInToolOverride | undefined
} & {
  [K in MCPGlobalBuiltinName]?: false | MCPBuiltInToolOverride
}

export type MCPTopLevelToolsMap = Record<string, Tool>

export type PromptHandlerArgs = {
  input: Record<string, unknown>
  req: PayloadRequest
  serverContext: ServerContext
}

export type Prompt = {
  argsSchema: JsonSchemaType
  description: string
  handler: (args: PromptHandlerArgs) => MaybePromise<{
    messages: Array<{ content: { text: string; type: 'text' }; role: 'assistant' | 'user' }>
  }>
  title: string
}

export type ResourceHandlerArgs = {
  /** Variables extracted from a `ResourceTemplate` URI. Empty for static-URI resources. */
  params: Record<string, string>
  req: PayloadRequest
  serverContext: ServerContext
  uri: URL
}

export type Resource = {
  description: string
  handler: (args: ResourceHandlerArgs) => MaybePromise<{
    contents: Array<{ text: string; uri: string }>
  }>
  mimeType: string
  title: string
  uri: ResourceTemplate | string
}

export type MCPPluginCollectionConfig<TSlug extends CollectionSlug> = {
  description?: string
  /** Fallback for built-in tools that don't set their own `overrideResponse`. */
  overrideResponse?: MCPResponseOverride
  tools?: MCPToolsMapForCollection<TSlug>
}

export type MCPPluginGlobalConfig = {
  description?: string
  overrideResponse?: MCPResponseOverride
  tools?: MCPGlobalToolsMap
}

/**
 * The user-facing config shape passed to `mcpPlugin({ ... })`. Tools, prompts,
 * resources, and per-collection/global tool maps live in their own nested
 * fields. `sanitizeMCPConfig` flattens those into `items` and applies defaults
 * to produce a `SanitizedMCPPluginConfig` — the form every internal consumer
 * actually works with.
 */
export type MCPPluginConfig = {
  collections?: {
    [Slug in CollectionSlug]?: MCPPluginCollectionConfig<Slug>
  }
  /** Skip MCP registration. The API key collection is still added (so DB / types stay stable). */
  disabled?: boolean
  globals?: {
    [Slug in GlobalSlug]?: MCPPluginGlobalConfig
  }
  mcp?: {
    serverOptions?: MCPServerOptions
    verboseLogs?: boolean
  }
  overrideApiKeyCollection?: (collection: CollectionConfig) => CollectionConfig
  /** Replace the default API-key auth with a custom resolver. */
  overrideAuth?: (args: {
    getAPIKeyDoc: (overrideApiKey?: string) => Promise<MCPAPIKeysDoc>
    getAuthorizedMCP: (args: { apiKeyDoc: MCPAPIKeysDoc }) => AuthorizedMCP
    pluginConfig: SanitizedMCPPluginConfig
    req: PayloadRequest
  }) => MaybePromise<AuthorizedMCP>
  prompts?: Record<string, Prompt>
  resources?: Record<string, Resource>
  /** Cross-cutting tools (not scoped to any collection or global). */
  tools?: MCPTopLevelToolsMap
  userCollection?: CollectionSlug
}

export type SanitizedMCPPluginConfig = {
  items: MCPItem[]
  userCollection: CollectionSlug
} & Pick<MCPPluginConfig, 'disabled' | 'mcp' | 'overrideApiKeyCollection' | 'overrideAuth'>

export type MCPServerOptions = {
  options?: ConstructorParameters<typeof McpServer>[1]
  serverInfo?: Partial<ConstructorParameters<typeof McpServer>[0]>
}

/**
 * Nested access tree as stored in the collection.
 * A `false` leaf disables that tool; missing keys defer to
 * defaults (built-in CRUD is on, opt-in tools are off).
 */
export type MCPAPIKeysDocAccessTree = {
  collections?: {
    [CollectionSlug: CollectionSlug]: {
      [ToolKey: string]: boolean
    }
  }
  globals?: {
    [GlobalSlug: GlobalSlug]: {
      [ToolKey: string]: boolean
    }
  }
  prompts?: {
    [PromptKey: string]: boolean
  }
  resources?: {
    [ResourceKey: string]: boolean
  }
  tools?: {
    [ToolKey: string]: boolean
  }
}

/**
 * Stored on `payload-mcp-api-keys` docs
 */
export type MCPAPIKeysDoc = {
  access: MCPAPIKeysDocAccessTree
  id: DefaultDocumentIDType
  overrideAccess?: boolean
  user: null | TypedUser
}

/**
 * One MCP primitive — tool, prompt, or resource — paired with the metadata both
 * the endpoint and the API key collection need. Built by `sanitizeMCPConfig`,
 * filtered by `getAuthorizedMCP`, registered by the MCP endpoint.
 *
 *  - `key`: the config identifier (`find`, `echo`). Used for the API-key deny
 *    lookup and as the admin checkbox field name. For collection/global tools,
 *    the MCP wire name (`findPosts`) is derived from `key + slug` at
 *    registration time.
 *  - `label`: human-readable admin-UI display text for the checkbox.
 *  - `tool` / `prompt` / `resource`: the live primitive (its own
 *    `description` is what both MCP clients and the admin UI surface).
 */
export type MCPItemBase = {
  key: string
  label: string
}

export type MCPItem =
  | ({
      collectionSlug: CollectionSlug
      tool: CollectionTool
      type: 'collectionTool'
    } & MCPItemBase)
  | ({
      globalSlug: GlobalSlug
      tool: GlobalTool
      type: 'globalTool'
    } & MCPItemBase)
  | ({
      prompt: Prompt
      type: 'prompt'
    } & MCPItemBase)
  | ({
      resource: Resource
      type: 'resource'
    } & MCPItemBase)
  | ({
      tool: Tool
      type: 'tool'
    } & MCPItemBase)

/**
 * The caller's identity + the MCP items they can use for this request. Returned
 * by `getAuthorizedMCP`; denied items are simply absent from `items`. Handlers
 * receive this via `args.authorizedMCP` so they can spread
 * `localAPIDefaults(authorizedMCP)` into every local API call.
 */
export type AuthorizedMCP = {
  items: MCPItem[]
  overrideAccess: boolean
  user: null | TypedUser
}
