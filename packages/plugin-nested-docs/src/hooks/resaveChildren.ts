import type { CollectionAfterChangeHook, CollectionConfig, PayloadRequest } from 'payload/types'

import type { PluginConfig } from '../types'

import populateBreadcrumbs from '../utilities/populateBreadcrumbs'

type ResaveArgs = {
  collection: CollectionConfig
  doc: Record<string, unknown>
  draft: boolean
  pluginConfig: PluginConfig
  req: PayloadRequest
}

const resave = async ({ collection, doc, draft, pluginConfig, req }: ResaveArgs) => {
  const parentDocIsPublished = doc._status === 'published'

  const children = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft,
    locale: req.locale,
    req,
    where: {
      parent: {
        equals: doc.id,
      },
    },
  })

  try {
    children.docs.forEach(async (child: any) => {
      const childIsPublished =
        typeof collection.versions === 'object' &&
        collection.versions.drafts &&
        child._status === 'published'

      if (!parentDocIsPublished && childIsPublished) return

      await req.payload.update({
        id: child.id,
        collection: collection.slug,
        data: {
          ...child,
          breadcrumbs: await populateBreadcrumbs(req, pluginConfig, collection, child),
        },
        depth: 0,
        draft: !childIsPublished,
        locale: req.locale,
        req,
      })
    })
  } catch (err: unknown) {
    req.payload.logger.error(
      `Nested Docs plugin has had an error while re-saving a child document${
        draft ? ' as draft' : ' as published'
      }.`,
    )
    req.payload.logger.error(err)
  }
}

const resaveChildren =
  (pluginConfig: PluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    const resaveChildrenAsync = async (): Promise<void> => {
      await resave({
        collection,
        doc,
        draft: true,
        pluginConfig,
        req,
      })

      if (doc._status === 'published') {
        await resave({
          collection,
          doc,
          draft: false,
          pluginConfig,
          req,
        })
      }
    }

    await resaveChildrenAsync()

    return undefined
  }

export default resaveChildren
