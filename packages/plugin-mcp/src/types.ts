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
 * JSON Schema 2020-12 literal, or a Standard Schema instance (Zod, Valibot, …).
 * Raw schemas may omit `$schema`; when present it must declare the 2020-12 dialect.
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

export type MCPAfterToolCallHook = (args: {
  input: unknown
  req: PayloadRequest
  response: MCPToolResponse
  toolName: string
}) => MaybePromise<MCPToolResponse>

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
  /**
   * Runs while authorizing each MCP request, before the tool is advertised or called. Return
   * `false` to make the tool unavailable for that request. This is skipped when `overrideAccess`
   * is enabled.
   */
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
  /**
   * Runs while authorizing each MCP request for this collection. Return `false` to reject calls
   * to this tool for the collection. The shared tool is not advertised when no collections allow
   * it, but can remain advertised when it is available for another collection. This is skipped
   * when `overrideAccess` is enabled.
   */
  access?: (args: CollectionMCPAccessArgs) => MaybePromise<boolean>
  handler: (args: CollectionToolHandlerArgs<TSchema>) => MaybePromise<MCPToolResponse>
  input?: TSchema
} & Pick<Tool, 'annotations' | 'description' | 'overrideResponse'>

export type GlobalTool<TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined> =
  {
    /**
     * Runs while authorizing each MCP request for this global. Return `false` to reject calls to
     * this tool for the global. The shared tool is not advertised when no globals allow it, but
     * can remain advertised when it is available for another global. This is skipped when
     * `overrideAccess` is enabled.
     */
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
  /**
   * Replaces the built-in tool's access check. Return `false` to make the tool unavailable for
   * this collection. This is skipped when `overrideAccess` is enabled.
   */
  access?: (args: CollectionMCPAccessArgs) => MaybePromise<boolean>
  annotations?: ToolAnnotations
  description?: string
  handler?: never
  overrideResponse?: MCPResponseOverride
}

export type MCPBuiltInGlobalToolOverride = {
  /**
   * Replaces the built-in tool's access check. Return `false` to make the tool unavailable for
   * this global. This is skipped when `overrideAccess` is enabled.
   */
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
  /**
   * Runs while authorizing each MCP request, before the prompt is advertised or used. Return
   * `false` to make the prompt unavailable for that request. This is skipped when
   * `overrideAccess` is enabled.
   */
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
  /**
   * Runs while authorizing each MCP request, before the resource is advertised or read. Return
   * `false` to make the resource unavailable for that request. This is skipped when
   * `overrideAccess` is enabled.
   */
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
  hooks?: {
    /** Transform a tool response after its handler returns */
    afterToolCall?: MCPAfterToolCallHook[]
  }
  mcp?: {
    serverOptions?: MCPServerOptions
    verboseLogs?: boolean
  }
  /**
   * Replace the default MCP authorization resolver.
   *
   * This hook replaces the default authentication flow. It must set `req.user` to the
   * authenticated Payload user, or to `null` for an anonymous caller, before returning.
   */
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
} & Pick<MCPPluginConfig, 'disabled' | 'hooks' | 'mcp' | 'overrideGetAuthorizedMCP'>

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
 * The MCP items and access mode authorized for this request. The authenticated user is available
 * as `req.user`.
 */
export type AuthorizedMCP = {
  items: MCPItem[]
  overrideAccess: boolean
}
