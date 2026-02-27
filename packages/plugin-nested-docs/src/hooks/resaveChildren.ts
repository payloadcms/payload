import type { CollectionAfterChangeHook, JsonObject, ValidationError } from 'payload'

import { APIError, ValidationErrorName } from 'payload'

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

    const publishedChildIds = new Set<string>(publishedChildren.docs.map((child) => child.id))

    // For versioned collections, find draft-only children (those that have
    // never been published). Children that have both a published and a draft
    // version must only have their published version updated — updating both
    // causes `createVersion` to set `latest = false` on the published version,
    // making it inaccessible on the live site.
    const draftOnlyChildren: JsonObject[] = []

    if (collection?.versions?.drafts) {
      const allDraftChildren = await req.payload.find({
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

      for (const child of allDraftChildren.docs) {
        if (child._status === 'draft' && !publishedChildIds.has(child.id)) {
          draftOnlyChildren.push(child)
        }
      }
    }

    const children: Array<{ doc: JsonObject; isDraft: boolean }> = [
      ...publishedChildren.docs.map((doc) => ({ doc, isDraft: false })),
      ...draftOnlyChildren.map((doc) => ({ doc, isDraft: true })),
    ]

    if (children.length) {
      try {
        for (const { doc: child, isDraft } of children) {
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
