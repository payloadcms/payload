import type { PayloadRequest, SanitizedPermissions } from 'payload'

import { getAccessResults, UnauthorizedError } from 'payload'

import type { AuthorizedMCP, MCPItem } from '../types.js'

import { getPluginConfig } from '../utils/getPluginConfig.js'

export type GetAuthorizedMCPArgs = {
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 * Authenticates an MCP request and removes items the user cannot access.
 * `overrideAccess` skips Payload and MCP item access checks.
 */
export const getAuthorizedMCP: (args: GetAuthorizedMCPArgs) => Promise<AuthorizedMCP> = async ({
  overrideAccess,
  req,
}) => {
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  if (pluginConfig.overrideGetAuthorizedMCP) {
    return await pluginConfig.overrideGetAuthorizedMCP({
      overrideAccess,
      pluginConfig,
      req,
    })
  }

  if (req.headers) {
    const headers = new Headers(req.headers)
    const hasAuthorization = headers.has('Authorization')

    headers.set('DisableAutologin', 'true')
    req.user = (await req.payload.auth({ headers, req })).user

    if (hasAuthorization && !req.user) {
      throw new UnauthorizedError(req.t)
    }
  }

  return {
    items: await filterMCPItems({
      items: pluginConfig.items,
      overrideAccess,
      req,
    }),
    overrideAccess,
  }
}

export const filterMCPItems = async ({
  items,
  overrideAccess,
  req,
}: {
  items: MCPItem[]
  overrideAccess: boolean
  req: PayloadRequest
}): Promise<MCPItem[]> => {
  // Match Payload core: overrideAccess bypasses access evaluation
  if (overrideAccess) {
    return items
  }

  const authorizedItems: MCPItem[] = []

  const permissions = await getAccessResults({ req })

  for (const item of items) {
    if (!(await checkItemAccess({ item, permissions, req }))) {
      continue
    }
    authorizedItems.push(item)
  }

  return authorizedItems
}

/**
 * Runs MCP item access callbacks
 */
const checkItemAccess = async ({
  item,
  permissions,
  req,
}: {
  item: MCPItem
  permissions?: SanitizedPermissions
  req: PayloadRequest
}): Promise<boolean> => {
  switch (item.type) {
    case 'collectionTool':
      return (
        !item.tool.access ||
        (await item.tool.access({ collectionSlug: item.collectionSlug, permissions, req }))
      )
    case 'globalTool':
      return (
        !item.tool.access ||
        (await item.tool.access({ globalSlug: item.globalSlug, permissions, req }))
      )
    case 'prompt':
      return !item.prompt.access || (await item.prompt.access({ permissions, req }))
    case 'resource':
      return !item.resource.access || (await item.resource.access({ permissions, req }))
    case 'tool':
      return !item.tool.access || (await item.tool.access({ permissions, req }))
  }
}
