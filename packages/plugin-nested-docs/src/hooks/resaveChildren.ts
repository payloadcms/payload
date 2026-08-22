import type { CollectionAfterChangeHook, JsonObject } from 'payload'

import { APIError, ValidationError } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js'

export const resaveChildren =
  (pluginConfig: NestedDocsPluginConfig): CollectionAfterChangeHook =>
  async ({ action, collection, doc, req }) => {
    if (collection?.versions?.drafts && action !== 'publish') {
      // If the parent is a draft, don't resave children
      return
    }

    const parentSlug = pluginConfig?.parentFieldSlug || 'parent'

    const initialDraftChildren = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 0,
      locale: req.locale,
      req,
      version: 'latest',
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
      limit: 0,
      locale: req.locale,
      req,
      version: 'published',
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
            action: isDraft ? 'saveDraft' : 'publish',
            collection: collection.slug,
            data: await populateBreadcrumbs({
              collection,
              data: child,
              generateLabel: pluginConfig.generateLabel,
              generateURL: pluginConfig.generateURL,
              parentFieldName: pluginConfig.parentFieldSlug,
              req,
            }),
            depth: 0,
            locale: req.locale,
            req,
          })
        }
      } catch (err: unknown) {
        req.payload.logger.error(
          `Nested Docs plugin encountered an error while re-saving a child document.`,
        )
        req.payload.logger.error(err)

        if (err instanceof ValidationError && err.data?.errors?.length) {
          throw new APIError(
            'Could not publish or save changes: One or more children are invalid.',
            400,
          )
        }
      }
    }

    return undefined
  }
