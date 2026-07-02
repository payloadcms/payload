import { getAccessResults, isEntityHidden } from 'payload'

import { defineTool } from '../../defineTool.js'

export const getConfigInfoTool = defineTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Config Info',
  },
  description: 'List the Payload collection and global slugs visible to this MCP client.',
}).handler(async ({ authorizedMCP, req }) => {
  const user = req.user
  const permissions = authorizedMCP.overrideAccess ? null : await getAccessResults({ req })
  const authorizedCollectionSlugs = new Set<string>()
  const authorizedGlobalSlugs = new Set<string>()

  for (const item of authorizedMCP.items) {
    if (item.type === 'collectionTool') {
      authorizedCollectionSlugs.add(item.collectionSlug)
    } else if (item.type === 'globalTool') {
      authorizedGlobalSlugs.add(item.globalSlug)
    }
  }

  const collections: string[] = []
  const globals: string[] = []

  for (const collection of req.payload.config.collections) {
    if (!authorizedCollectionSlugs.has(collection.slug)) {
      continue
    }
    if (user && isEntityHidden({ hidden: collection.admin.hidden, user })) {
      continue
    }
    if (!authorizedMCP.overrideAccess && !permissions?.collections?.[collection.slug]?.read) {
      continue
    }

    collections.push(collection.slug)
  }

  for (const global of req.payload.config.globals) {
    if (!authorizedGlobalSlugs.has(global.slug)) {
      continue
    }
    if (user && isEntityHidden({ hidden: global.admin.hidden, user })) {
      continue
    }
    if (!authorizedMCP.overrideAccess && !permissions?.globals?.[global.slug]?.read) {
      continue
    }

    globals.push(global.slug)
  }

  return {
    content: [
      {
        type: 'text',
        text: `Collections: ${collections.join(', ') || 'none'}\nGlobals: ${globals.join(', ') || 'none'}`,
      },
    ],
  }
})
