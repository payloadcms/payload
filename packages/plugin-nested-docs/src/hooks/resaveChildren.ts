import type { CollectionAfterChangeHook, CollectionConfig, PayloadRequestWithData } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js'

type ResaveArgs = {
  collection: CollectionConfig
  doc: Record<string, unknown>
  draft: boolean
  pluginConfig: NestedDocsPluginConfig
  req: PayloadRequestWithData
}

const resave = async ({ collection, doc, draft, pluginConfig, req }: ResaveArgs) => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parentDocIsPublished = doc._status === 'published'

  const children = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft,
    locale: req.locale,
    req,
    where: {
      [parentSlug]: {
        equals: doc.id,
      },
    },
  })

  const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs'

  try {
    await children.docs.reduce(async (priorSave, child) => {
      await priorSave

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
          [breadcrumbSlug]: await populateBreadcrumbs(req, pluginConfig, collection, child),
        },
        depth: 0,
        draft: !childIsPublished,
        locale: req.locale,
        req,
      })
    }, Promise.resolve())
  } catch (err: unknown) {
    req.payload.logger.error(
      `Nested Docs plugin has had an error while re-saving a child document${
        draft ? ' as draft' : ' as published'
      }.`,
    )
    req.payload.logger.error(err)
  }
}

export const resaveChildren =
  (pluginConfig: NestedDocsPluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
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

    return undefined
  }
