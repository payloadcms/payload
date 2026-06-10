import { getAccessResults, isEntityHidden } from 'payload'

import { defineTool } from '../../defineTool.js'

type EntityInfo = {
  slug: string
}

export const getConfigInfoTool = defineTool({
  description: 'List the Payload collection and global slugs visible to this MCP client.',
}).handler(async ({ authorizedMCP, req }) => {
  const user = authorizedMCP.user ?? req.user ?? null
  const reqWithUser = user
    ? {
        ...req,
        user,
      }
    : req
  const permissions = user ? await getAccessResults({ req: reqWithUser }) : null

  const collections: EntityInfo[] = []
  const globals: EntityInfo[] = []

  for (const collection of req.payload.config.collections) {
    const slug = collection.slug
    if (user && isEntityHidden({ hidden: collection.admin.hidden, user })) {
      continue
    }
    if (user && !permissions?.collections?.[slug]?.read) {
      continue
    }

    collections.push({ slug })
  }

  for (const global of req.payload.config.globals) {
    const slug = global.slug
    if (user && isEntityHidden({ hidden: global.admin.hidden, user })) {
      continue
    }
    if (user && !permissions?.globals?.[slug]?.read) {
      continue
    }

    globals.push({ slug })
  }

  const collectionSlugs = collections.map(({ slug }) => slug).join(', ') || 'none'
  const globalSlugs = globals.map(({ slug }) => slug).join(', ') || 'none'

  return {
    content: [
      {
        type: 'text',
        text: `Collections: ${collectionSlugs}\nGlobals: ${globalSlugs}`,
      },
    ],
  }
})
