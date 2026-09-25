import type { SanitizedMCPPluginConfig } from '@payloadcms/plugin-mcp'
import type {
  CollectionBeforeOperationHook,
  Config,
  GlobalBeforeOperationHook,
  Plugin,
} from 'payload'

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { definePlugin } from 'payload'

export const AUDIT_LOG_PATH_ENV = 'PAYLOAD_AUDIT_LOG_PATH'

export type PayloadOperation = {
  entityType: 'collection' | 'global'
  operation: string
  payloadAPI: string
  slug: string
}

export type AuditedPayloadOperation = {
  blocked: boolean
} & PayloadOperation

export type AuditedMCPToolCall = {
  input: unknown
  name: string
  response: {
    content: unknown[]
    doc?: Record<string, unknown>
    isError?: boolean
    structuredContent?: unknown
  }
}

export type AuditEvent =
  | ({ type: 'mcp-tool-call' } & AuditedMCPToolCall)
  | ({ type: 'payload-operation' } & AuditedPayloadOperation)

export type AuditPluginOptions = {
  /** Runs before each Payload operation. Throw to record and block the operation. */
  beforeOperation?: (operation: PayloadOperation) => Promise<void> | void
  path?: string
}

type MCPAfterToolCallHook = NonNullable<
  NonNullable<SanitizedMCPPluginConfig['hooks']>['afterToolCall']
>[number]

const mcpAuditHookPath = Symbol('mcpAuditHookPath')

type MarkedMCPAfterToolCallHook = {
  [mcpAuditHookPath]?: string
} & MCPAfterToolCallHook

type MCPPluginWithSanitizedOptions = {
  sanitizedOptions?: SanitizedMCPPluginConfig
} & Plugin

/**
 * Records collection and global operations in an append-only audit log. When the MCP plugin is
 * installed, completed MCP tool calls are added to the same log automatically.
 *
 * `beforeOperation` can inspect each operation and throw to block it. Blocked attempts are recorded
 * before the original error is rethrown.
 */
export const auditPlugin = definePlugin<AuditPluginOptions>({
  slug: 'test-audit',
  order: Number.MAX_SAFE_INTEGER,
  plugin: ({ config, options, plugins }) => {
    const auditPath = options.path

    if (!auditPath) {
      return config
    }

    addMCPAuditHook({
      auditPath,
      mcpPlugin: plugins['@payloadcms/plugin-mcp'],
    })

    const auditOperation = async (operation: PayloadOperation): Promise<void> => {
      const recordOperation = (blocked: boolean): void => {
        appendAuditEvent({
          event: {
            ...operation,
            blocked,
            type: 'payload-operation',
          },
          path: auditPath,
        })
      }

      try {
        await options.beforeOperation?.(operation)
        recordOperation(false)
      } catch (error) {
        recordOperation(true)
        throw error
      }
    }

    const auditCollectionOperation: CollectionBeforeOperationHook = ({
      collection,
      operation,
      req,
    }) =>
      auditOperation({
        slug: collection.slug,
        entityType: 'collection',
        operation,
        payloadAPI: req.payloadAPI,
      })

    const auditGlobalOperation: GlobalBeforeOperationHook = ({ global, operation, req }) =>
      auditOperation({
        slug: global.slug,
        entityType: 'global',
        operation,
        payloadAPI: req.payloadAPI,
      })

    return addAuditHooks({
      auditCollectionOperation,
      auditGlobalOperation,
      config,
    })
  },
})

/** Appends one compact JSON event per line without a cross-process read-modify-write race. */
export function appendAuditEvent({ event, path }: { event: AuditEvent; path?: string }): void {
  if (!path) {
    return
  }

  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, `${JSON.stringify(event)}\n`, 'utf8')
}

/** Reads an active JSONL audit log or a finalized JSON array. */
export function readAudit({ path }: { path: string }): AuditEvent[] {
  if (!existsSync(path)) {
    return []
  }

  const contents = readFileSync(path, 'utf8').trim()

  if (!contents) {
    return []
  }

  if (contents.startsWith('[')) {
    const parsed = JSON.parse(contents) as unknown

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected audit file "${path}" to contain a JSON array`)
    }

    return parsed as AuditEvent[]
  }

  return contents.split(/\r?\n/u).map((line) => JSON.parse(line) as AuditEvent)
}

/** Rewrites an existing live audit log as a readable, valid JSON array. */
export function finalizeAudit({ path }: { path: string }): AuditEvent[] {
  if (!existsSync(path)) {
    return []
  }

  const events = readAudit({ path })

  writeFileSync(path, `${JSON.stringify(events, null, 2)}\n`, 'utf8')
  return events
}

function addMCPAuditHook({
  auditPath,
  mcpPlugin,
}: {
  auditPath: string
  mcpPlugin?: Plugin
}): void {
  if (!mcpPlugin) {
    return
  }

  const pluginConfig = (mcpPlugin as MCPPluginWithSanitizedOptions).sanitizedOptions

  if (!pluginConfig) {
    throw new Error(
      'auditPlugin found @payloadcms/plugin-mcp before its configuration was initialized',
    )
  }

  pluginConfig.hooks ??= {}
  pluginConfig.hooks.afterToolCall ??= []

  if (
    pluginConfig.hooks.afterToolCall.some(
      (hook) => (hook as MarkedMCPAfterToolCallHook)[mcpAuditHookPath] === auditPath,
    )
  ) {
    return
  }

  const auditMCPToolCall: MarkedMCPAfterToolCallHook = ({ input, response, toolName }) => {
    appendAuditEvent({
      path: auditPath,
      event: {
        type: 'mcp-tool-call',
        input,
        name: toolName,
        response,
      },
    })

    return response
  }

  auditMCPToolCall[mcpAuditHookPath] = auditPath
  pluginConfig.hooks.afterToolCall.push(auditMCPToolCall)
}

function addAuditHooks({
  auditCollectionOperation,
  auditGlobalOperation,
  config,
}: {
  auditCollectionOperation: CollectionBeforeOperationHook
  auditGlobalOperation: GlobalBeforeOperationHook
  config: Config
}): Config {
  return {
    ...config,
    collections: config.collections?.map((collection) => ({
      ...collection,
      hooks: {
        ...collection.hooks,
        beforeOperation: [auditCollectionOperation, ...(collection.hooks?.beforeOperation ?? [])],
      },
    })),
    globals: config.globals?.map((global) => ({
      ...global,
      hooks: {
        ...global.hooks,
        beforeOperation: [auditGlobalOperation, ...(global.hooks?.beforeOperation ?? [])],
      },
    })),
  }
}
