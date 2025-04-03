import type {
  CollectionAfterChangeHook,
  CollectionConfig,
  JsonObject,
  PayloadRequest,
  ValidationError,
} from 'payload'

import { APIError } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js'

type ResaveArgs = {
  collection: CollectionConfig
  doc: JsonObject
  draft: boolean
  pluginConfig: NestedDocsPluginConfig
  req: PayloadRequest
}

const resave = async ({ collection, doc, draft, pluginConfig, req }: ResaveArgs) => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs'

  if (draft) {
    // If the parent is a draft, don't resave children
    return
  } else {
    const initialDraftChildren = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      draft: true,
      limit: 0,
      locale: req.locale,
      req,
      where: {
        [parentSlug]: {
          equals: doc.id,
        },
      },
    })

    const draftChildren = initialDraftChildren.docs.filter((child) => child._status === 'draft')

    const publishedChildren = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      draft: false,
      limit: 0,
      locale: req.locale,
      req,
      where: {
        [parentSlug]: {
          equals: doc.id,
        },
      },
    })

    const childrenById = [...draftChildren, ...publishedChildren.docs].reduce<
      Record<string, JsonObject[]>
    >((acc, child) => {
      acc[child.id] = acc[child.id] || []
      acc[child.id]!.push(child)
      return acc
    }, {})

    const sortedChildren = Object.values(childrenById).flatMap((group: JsonObject[]) => {
      return group.sort((a, b) => {
        if (a.updatedAt !== b.updatedAt) {
          return a.updatedAt > b.updatedAt ? 1 : -1
        }
        return a._status === 'published' ? 1 : -1
      })
    })

    if (sortedChildren) {
      try {
        for (const child of sortedChildren) {
          const isDraft = child._status !== 'published'

          await req.payload.update({
            id: child.id,
            collection: collection.slug,
            data: populateBreadcrumbs(req, pluginConfig, collection, child),
            depth: 0,
            draft: isDraft,
            locale: req.locale,
            req,
          })
        }
      } catch (err: unknown) {
        req.payload.logger.error(
          `Nested Docs plugin encountered an error while re-saving a child document.`,
        )
        req.payload.logger.error(err)

        if (
          (err as ValidationError)?.name === 'ValidationError' &&
          (err as ValidationError)?.data?.errors?.length
        ) {
          throw new APIError(
            'Could not publish or save changes: One or more children are invalid.',
            400,
          )
        }
      }
    }
  }
}

export const resaveChildren =
  (pluginConfig: NestedDocsPluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    await resave({
      collection,
      doc,
      draft: doc._status === 'published' ? false : true,
      pluginConfig,
      req,
    })

    return undefined
  }
