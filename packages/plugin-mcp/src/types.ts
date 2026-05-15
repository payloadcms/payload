import type { McpServer, ResourceTemplate, ServerContext } from '@modelcontextprotocol/server'
import type {
  AuthCollectionSlug,
  CollectionConfig,
  CollectionSlug,
  DefaultDocumentIDType,
  GlobalSlug,
  MaybePromise,
  Payload,
  PayloadRequest,
  TypedUser,
} from 'payload'

/** Permissive — the schema is consumed by `fromJsonSchema()` and validated at runtime. */
export type JsonSchemaObject = {
  $ref?: string
  $schema?: string
  [key: string]: unknown
  additionalProperties?: boolean | JsonSchemaObject
  allOf?: JsonSchemaObject[]
  anyOf?: JsonSchemaObject[]
  default?: unknown
  definitions?: Record<string, JsonSchemaObject>
  description?: string
  enum?: unknown[]
  format?: string
  items?: JsonSchemaObject | JsonSchemaObject[]
  maximum?: number
  maxLength?: number
  minimum?: number
  minLength?: number
  oneOf?: JsonSchemaObject[]
  pattern?: string
  properties?: Record<string, JsonSchemaObject>
  required?: string[]
  type?: string | string[]
}

export type MCPToolResponse = {
  content: Array<{ text: string; type: 'text' }>
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

export type Tool<Args extends ToolHandlerArgs = ToolHandlerArgs> = {
  description: string
  handler: (args: Args) => MaybePromise<MCPToolResponse>
  input?: JsonSchemaObject
  overrideResponse?: MCPResponseOverride
}

export type CollectionTool = Tool<CollectionToolHandlerArgs>
export type GlobalTool = Tool<GlobalToolHandlerArgs>

/** Configures (or disables) a built-in tool without replacing it. No handler. */
export type MCPBuiltInToolOverride = {
  description?: string
  overrideResponse?: MCPResponseOverride
}

/**
 * Tool-map entry value.
 *
 * - `false` disables (built-ins only)
 * - `true` enables an opt-in built-in (auth tools)
 * - object with `handler` defines a custom tool
 * - object without `handler` overrides a built-in
 */
export type MCPCollectionToolEntry = boolean | CollectionTool | MCPBuiltInToolOverride
export type MCPGlobalToolEntry = boolean | GlobalTool | MCPBuiltInToolOverride
export type MCPTopLevelToolEntry = Tool

export type MCPCollectionBuiltinName = 'create' | 'delete' | 'find' | 'update'

/** Auth ops on auth-enabled collections. Opt-in: set to `true` (or an override) to enable. */
export type MCPCollectionAuthToolName =
  | 'auth'
  | 'forgotPassword'
  | 'login'
  | 'resetPassword'
  | 'unlock'
  | 'verify'

export type MCPGlobalBuiltinName = 'find' | 'update'

export type MCPCollectionToolsMap = {
  [customToolName: string]: MCPCollectionToolEntry | undefined
} & {
  [K in MCPCollectionBuiltinName]?: boolean | MCPBuiltInToolOverride
}

export type MCPAuthCollectionToolsMap = {
  [customToolName: string]: MCPCollectionToolEntry | undefined
} & {
  [K in MCPCollectionAuthToolName | MCPCollectionBuiltinName]?: boolean | MCPBuiltInToolOverride
}

/** Auth-enabled collections get auth-tool name autocomplete; others get CRUD-only. */
export type MCPToolsMapForCollection<Slug extends CollectionSlug> = Slug extends AuthCollectionSlug
  ? MCPAuthCollectionToolsMap
  : MCPCollectionToolsMap

export type MCPGlobalToolsMap = {
  [customToolName: string]: MCPGlobalToolEntry | undefined
} & {
  [K in MCPGlobalBuiltinName]?: boolean | MCPBuiltInToolOverride
}

export type MCPTopLevelToolsMap = Record<string, Tool>

export type PromptHandlerArgs = {
  input: Record<string, unknown>
  req: PayloadRequest
  serverContext: ServerContext
}

export type Prompt = {
  argsSchema: JsonSchemaObject
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

export type MCPPluginConfig = {
  collections?: {
    [Slug in CollectionSlug]?: {
      description?: string
      /** Fallback for built-in tools that don't set their own `overrideResponse`. */
      overrideResponse?: MCPResponseOverride
      tools?: MCPToolsMapForCollection<Slug>
    }
  }
  /** Skip MCP registration. The API key collection is still added (so DB / type stay stable). */
  disabled?: boolean
  globals?: Partial<
    Record<
      GlobalSlug,
      {
        description?: string
        overrideResponse?: MCPResponseOverride
        tools?: MCPGlobalToolsMap
      }
    >
  >
  mcp?: {
    serverOptions?: MCPServerOptions
    verboseLogs?: boolean
  }
  overrideApiKeyCollection?: (collection: CollectionConfig) => CollectionConfig
  /** Replace the default API-key auth with a custom resolver. */
  overrideAuth?: (args: {
    getAPIKeyDoc: (overrideApiKey?: string) => Promise<MCPAPIKeysDoc>
    getAuthorizedMCP: (args: { apiKeyDoc: MCPAPIKeysDoc }) => AuthorizedMCP
    pluginConfig: MCPPluginConfig
    req: PayloadRequest
  }) => MaybePromise<AuthorizedMCP>
  prompts?: Record<string, Prompt>
  resources?: Record<string, Resource>
  /** Cross-cutting tools (not scoped to any collection or global). */
  tools?: MCPTopLevelToolsMap
  userCollection?: CollectionSlug
}

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
 * The caller's identity + the MCP primitives (tools, prompts, resources) they
 * can use for this request. Returned by `getAuthorizedMCP` — every entry is a
 * fully-resolved object; denied primitives are simply absent. The endpoint
 * iterates this directly and registers each, and handlers receive it via
 * `ctx.authorizedMCP` so they can spread `localAPIDefaults(authorizedMCP)`
 * into every local API call (`user` + `overrideAccess` propagate).
 */
export type AuthorizedMCP = {
  collections: {
    [CollectionSlug: CollectionSlug]: {
      [ToolKey: string]: CollectionTool
    }
  }
  globals: {
    [GlobalSlug: GlobalSlug]: {
      [ToolKey: string]: GlobalTool
    }
  }
  overrideAccess: boolean
  prompts: {
    [PromptKey: string]: Prompt
  }
  resources: {
    [ResourceKey: string]: Resource
  }
  tools: {
    [ToolKey: string]: Tool
  }
  user: null | TypedUser
}
