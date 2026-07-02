import type {
  CallToolResult,
  ContentBlock,
  JsonSchemaType,
  McpServer,
  ResourceTemplate,
  ServerContext,
  StandardSchemaWithJSON,
  ToolAnnotations,
} from '@modelcontextprotocol/server'
import type {
  AuthCollectionSlug,
  CollectionSlug,
  GlobalSlug,
  MaybePromise,
  PayloadRequest,
  SanitizedPermissions,
  TypedUser,
} from 'payload'

import type { GetAuthorizedMCPArgs } from './endpoint/access.js'
import type {
  MCPCollectionAuthToolName,
  MCPCollectionBuiltinName,
  MCPGlobalBuiltinName,
} from './mcp/builtinTools.js'

export type { MCPCollectionAuthToolName, MCPCollectionBuiltinName, MCPGlobalBuiltinName }

/** Re-exported from `@modelcontextprotocol/server` — common MCP types used in plugin config. */
export type { JsonSchemaType, StandardSchemaWithJSON, ToolAnnotations }

/**
 * What a tool's `input` (or a prompt's `argsSchema`) can be — either a raw
 * JSON Schema literal, or a Standard Schema instance (Zod, Valibot, …).
 */
export type ToolInputSchema = JsonSchemaType | StandardSchemaWithJSON

export type MCPToolResponse = {
  content: ContentBlock[]
  /**
   * If available, return the document fetched within the
   * mcp tool. This is threaded as an additional argument to
   * overrideResponse functions and stripped before going on the wire.
   */
  doc?: Record<string, unknown>
} & Pick<CallToolResult, '_meta' | 'isError' | 'structuredContent'>

export type MCPResponseOverride = (
  response: MCPToolResponse,
  doc: Record<string, unknown>,
  req: PayloadRequest,
) => MCPToolResponse

/**
 * The handler's `input` type. A specific Standard Schema (Zod, Valibot, …) gets
 * its inferred output; anything else falls back to `Record<string, unknown>`.
 */
export type TypedInput<TSchema> = TSchema extends StandardSchemaWithJSON
  ? StandardSchemaWithJSON extends TSchema
    ? Record<string, unknown>
    : StandardSchemaWithJSON.InferOutput<TSchema>
  : Record<string, unknown>

export type MCPAccessArgs = {
  permissions?: SanitizedPermissions
  req: PayloadRequest
}

export type CollectionMCPAccessArgs = {
  collectionSlug: CollectionSlug
} & MCPAccessArgs

export type GlobalMCPAccessArgs = {
  globalSlug: GlobalSlug
} & MCPAccessArgs

export type ToolHandlerArgs<TSchema = undefined> = {
  authorizedMCP: AuthorizedMCP
  input: TypedInput<TSchema>
  req: PayloadRequest
  serverContext: ServerContext
}

export type CollectionToolHandlerArgs<TSchema = undefined> = {
  collectionSlug: CollectionSlug
} & ToolHandlerArgs<TSchema>

export type GlobalToolHandlerArgs<TSchema = undefined> = {
  globalSlug: GlobalSlug
} & ToolHandlerArgs<TSchema>

export type Tool<TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined> = {
  access?: (args: MCPAccessArgs) => MaybePromise<boolean>
  annotations?: ToolAnnotations
  description: string
  handler: (args: ToolHandlerArgs<TSchema>) => MaybePromise<MCPToolResponse>
  input?: TSchema
  /**
   * Override the return value of the tool handler
   */
  overrideResponse?: MCPResponseOverride
}

export type CollectionTool<
  TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined,
> = {
  access?: (args: CollectionMCPAccessArgs) => MaybePromise<boolean>
  handler: (args: CollectionToolHandlerArgs<TSchema>) => MaybePromise<MCPToolResponse>
  input?: TSchema
} & Pick<Tool, 'annotations' | 'description' | 'overrideResponse'>

export type GlobalTool<TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined> =
  {
    access?: (args: GlobalMCPAccessArgs) => MaybePromise<boolean>
    handler: (args: GlobalToolHandlerArgs<TSchema>) => MaybePromise<MCPToolResponse>
    input?: TSchema
  } & Pick<Tool, 'annotations' | 'description' | 'overrideResponse'>

/**
 * Configures (or disables) a built-in tool without replacing it.
 * `handler?: never` prevents a full `CollectionTool`/`GlobalTool` (which has a
 * required handler) from being silently accepted at a built-in key slot.
 */
export type MCPBuiltInCollectionToolOverride = {
  access?: (args: CollectionMCPAccessArgs) => MaybePromise<boolean>
  annotations?: ToolAnnotations
  description?: string
  handler?: never
  overrideResponse?: MCPResponseOverride
}

export type MCPBuiltInGlobalToolOverride = {
  access?: (args: GlobalMCPAccessArgs) => MaybePromise<boolean>
  annotations?: ToolAnnotations
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
  [customToolName: string]: boolean | CollectionTool | MCPBuiltInCollectionToolOverride | undefined
} & {
  [K in MCPCollectionBuiltinName]?: false | MCPBuiltInCollectionToolOverride
}

export type MCPAuthCollectionToolsMap = {
  [K in MCPCollectionAuthToolName]?: MCPBuiltInCollectionToolOverride | true
} & MCPCollectionToolsMap

/** Auth-enabled collections get auth-tool name autocomplete; others get CRUD-only. */
export type MCPToolsMapForCollection<Slug extends CollectionSlug> = Slug extends AuthCollectionSlug
  ? MCPAuthCollectionToolsMap
  : MCPCollectionToolsMap

export type MCPGlobalToolsMap = {
  [customToolName: string]: boolean | GlobalTool | MCPBuiltInGlobalToolOverride | undefined
} & {
  [K in MCPGlobalBuiltinName]?: false | MCPBuiltInGlobalToolOverride
}

export type MCPTopLevelToolsMap = Record<string, Tool>

export type PromptHandlerArgs<TSchema = undefined> = {
  input: TypedInput<TSchema>
  req: PayloadRequest
  serverContext: ServerContext
}

export type Prompt<TSchema extends ToolInputSchema = ToolInputSchema> = {
  access?: (args: MCPAccessArgs) => MaybePromise<boolean>
  argsSchema: TSchema
  description: string
  handler: (args: PromptHandlerArgs<TSchema>) => MaybePromise<{
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
  access?: (args: MCPAccessArgs) => MaybePromise<boolean>
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
  /** Skip MCP endpoint registration. */
  disabled?: boolean
  globals?: {
    [Slug in GlobalSlug]?: MCPPluginGlobalConfig
  }
  mcp?: {
    serverOptions?: MCPServerOptions
    verboseLogs?: boolean
  }
  /** Replace the default MCP authorization resolver. */
  overrideGetAuthorizedMCP?: (
    args: {
      pluginConfig: SanitizedMCPPluginConfig
    } & GetAuthorizedMCPArgs,
  ) => MaybePromise<AuthorizedMCP>
  prompts?: Record<string, Prompt>
  resources?: Record<string, Resource>
  /** Cross-cutting tools (not scoped to any collection or global). */
  tools?: MCPTopLevelToolsMap
}

export type SanitizedMCPPluginConfig = {
  items: MCPItem[]
} & Pick<MCPPluginConfig, 'disabled' | 'mcp' | 'overrideGetAuthorizedMCP'>

export type MCPServerOptions = {
  options?: ConstructorParameters<typeof McpServer>[1]
  serverInfo?: Partial<ConstructorParameters<typeof McpServer>[0]>
}

/**
 * One MCP primitive plus the metadata needed for config-driven filtering and
 * registration.
 *
 * - `configKey`: the config identifier, e.g. `find` or `echo`.
 * - `mcpName`: the MCP wire name, e.g. `findDocuments` or `echo`.
 * - `label`: human-readable display text.
 */
export type MCPItemBase = {
  configKey: string
  label: string
  mcpName: string
}

export type CollectionMCPItem = {
  collectionSlug: CollectionSlug
  tool: CollectionTool
  type: 'collectionTool'
} & MCPItemBase

export type GlobalMCPItem = {
  globalSlug: GlobalSlug
  tool: GlobalTool
  type: 'globalTool'
} & MCPItemBase

export type MCPItem =
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
  | CollectionMCPItem
  | GlobalMCPItem

/**
 * The caller's identity + the MCP items authorized for this request. Disabled
 * items and items blocked by access callbacks or Payload operation access are
 * absent from `items`. Tool handlers receive this via `args.authorizedMCP` so
 * they can spread `localAPIDefaults(authorizedMCP)` into every local API call.
 */
export type AuthorizedMCP = {
  items: MCPItem[]
  overrideAccess: boolean
  user: null | TypedUser
}
