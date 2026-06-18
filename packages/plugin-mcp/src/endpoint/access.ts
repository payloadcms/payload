import type { PayloadRequest, SanitizedPermissions, TypedUser } from 'payload'

import { getAccessResults, UnauthorizedError } from 'payload'

import type { AuthorizedMCP } from '../types.js'
import {
  COLLECTION_BUILTINS,
  GLOBAL_BUILTINS,
  type MCPCollectionBuiltinName,
  type MCPGlobalBuiltinName,
} from '../mcp/builtinTools.js'

import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

/**
 * Resolves the MCP caller and returns the MCP surface authorized for that request.
 *
 * Authorization has two layers:
 * 1. Payload collection/global permissions determine whether built-in operation tools are shown.
 * 2. MCP `access` callbacks can further hide any configured tool, prompt, or resource.
 */
export const getAuthorizedMCP: (args: {
  req: PayloadRequest
  skipAuth?: boolean
}) => Promise<AuthorizedMCP> = async ({ req, skipAuth = false }) => {
  const logger = getLogger({ payload: req.payload })
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  const getAuthorizedMCPForUser = ({
    overrideAccess = false,
    user,
  }: {
    overrideAccess?: boolean
    user: null | TypedUser
  }): AuthorizedMCP => ({
    items: pluginConfig.items,
    overrideAccess,
    user,
  })

  if (skipAuth) {
    return await filterAuthorizedMCPItems({
      authorizedMCP: getAuthorizedMCPForUser({
        overrideAccess: true,
        user: req.user ?? null,
      }),
      req,
    })
  }

  if (pluginConfig.overrideAuth) {
    return await filterAuthorizedMCPItems({
      authorizedMCP: await pluginConfig.overrideAuth({
        getAPIKeyUser: (headers) => getAPIKeyUser({ headers, req }),
        getAuthorizedMCP: getAuthorizedMCPForUser,
        pluginConfig,
        req,
      }),
      req,
    })
  }

  if (process.env.NODE_ENV === 'development' && !req.headers.get('Authorization')) {
    logger.info('Dev mode: skipping API key check, using session user')
    return await filterAuthorizedMCPItems({
      authorizedMCP: getAuthorizedMCPForUser({
        overrideAccess: true,
        user: req.user ?? null,
      }),
      req,
    })
  }

  return await filterAuthorizedMCPItems({
    authorizedMCP: getAuthorizedMCPForUser({ user: await getAPIKeyUser({ req }) }),
    req,
  })
}

const getAPIKeyUser = async ({
  headers,
  req,
}: {
  headers?: Headers
  req: PayloadRequest
}): Promise<TypedUser> => {
  const user = headers ? (await req.payload.auth({ headers: new Headers(headers) })).user : req.user

  if (user?._strategy !== 'api-key') {
    throw new UnauthorizedError()
  }

  return user
}

const filterAuthorizedMCPItems = async ({
  authorizedMCP,
  req,
}: {
  authorizedMCP: AuthorizedMCP
  req: PayloadRequest
}): Promise<AuthorizedMCP> => {
  const items: AuthorizedMCP['items'] = []
  // Layer 1: use Payload access results to hide built-in collection/global
  // operation tools the caller cannot run. `overrideAccess` skips this layer.
  const permissions = authorizedMCP.overrideAccess
    ? null
    : await getAccessResults({ req: { ...req, user: authorizedMCP.user } })

  for (const item of authorizedMCP.items) {
    if (item.type === 'collectionTool') {
      // Built-in collection tools map to Payload collection operations.
      // Custom collection tools have no operation gate here.
      const operation =
        COLLECTION_BUILTINS[item.configKey as MCPCollectionBuiltinName]?.accessOperation

      if (
        operation &&
        permissions &&
        !permissions.collections?.[item.collectionSlug]?.[operation]
      ) {
        continue
      }

      // Layer 2: per-tool access callbacks can further hide the item.
      if (
        item.tool.access &&
        !(await item.tool.access({
          authorizedMCP,
          collectionSlug: item.collectionSlug,
          req,
        }))
      ) {
        continue
      }
      items.push(item)
      continue
    }

    if (item.type === 'globalTool') {
      // Built-in global tools map to Payload global operations.
      // Custom global tools have no operation gate here.
      const operation = GLOBAL_BUILTINS[item.configKey as MCPGlobalBuiltinName]?.accessOperation

      if (operation && permissions && !permissions.globals?.[item.globalSlug]?.[operation]) {
        continue
      }

      // Layer 2: per-tool access callbacks can further hide the item.
      if (
        item.tool.access &&
        !(await item.tool.access({
          authorizedMCP,
          globalSlug: item.globalSlug,
          req,
        }))
      ) {
        continue
      }
      items.push(item)
      continue
    }

    const access =
      item.type === 'prompt'
        ? item.prompt.access
        : item.type === 'resource'
          ? item.resource.access
          : item.tool.access

    // Prompts, resources, and top-level tools only have the MCP access-callback layer.
    if (access && !(await access({ authorizedMCP, req }))) {
      continue
    }

    items.push(item)
  }

  return {
    ...authorizedMCP,
    items,
  }
}
