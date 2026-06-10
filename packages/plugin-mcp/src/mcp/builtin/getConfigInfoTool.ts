import { getAccessResults, isEntityHidden } from 'payload'

import { defineTool } from '../../defineTool.js'

export const getConfigInfoTool = defineTool({
  description: 'List the Payload collection and global slugs visible to this MCP client.',
}).handler(async ({ authorizedMCP, req }) => {
  const user = authorizedMCP.user ?? req.user ?? null
  const permissions = user ? await getAccessResults({ req: { ...req, user } }) : null

  const collections: string[] = []
  const globals: string[] = []

  for (const collection of req.payload.config.collections) {
    if (user && isEntityHidden({ hidden: collection.admin.hidden, user })) {
      continue
    }
    if (user && !permissions?.collections?.[collection.slug]?.read) {
      continue
    }

    collections.push(collection.slug)
  }

  for (const global of req.payload.config.globals) {
    if (user && isEntityHidden({ hidden: global.admin.hidden, user })) {
      continue
    }
    if (user && !permissions?.globals?.[global.slug]?.read) {
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
