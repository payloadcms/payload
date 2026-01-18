import type { CollectionAfterChangeHook, JsonObject, ValidationError } from '@ruya.sa/payload'

import { APIError, ValidationErrorName } from '@ruya.sa/payload'

import type { NestedDocsPluginConfig } from '../types.js'

import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js'

export const resaveChildren =
  (pluginConfig: NestedDocsPluginConfig): CollectionAfterChangeHook =>
  async ({ collection, doc, req }) => {
    if (collection?.versions?.drafts && doc._status !== 'published') {
      // If the parent is a draft, don't resave children
      return
    }

    const parentSlug = pluginConfig?.parentFieldSlug || 'parent'

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

    if (sortedChildren.length) {
      try {
        for (const child of sortedChildren) {
          const isDraft = child._status !== 'published'

          await req.payload.update({
            id: child.id,
            collection: collection.slug,
            data: populateBreadcrumbs({
              collection,
              data: child,
              generateLabel: pluginConfig.generateLabel,
              generateURL: pluginConfig.generateURL,
              parentFieldName: pluginConfig.parentFieldSlug,
              req,
            }),
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
          (err as ValidationError)?.name === ValidationErrorName &&
          (err as ValidationError)?.data?.errors?.length
        ) {
          throw new APIError(
            'Could not publish or save changes: One or more children are invalid.',
            400,
          )
        }
      }
    }

    return undefined
  }
