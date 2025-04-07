import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import type { Breadcrumb, NestedDocsPluginConfig } from '../types.js'

// This hook automatically re-saves a document after it is created
// so that we can build its breadcrumbs with the newly created document's ID.

export const resaveSelfAfterCreate =
  (pluginConfig: NestedDocsPluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  async ({ doc, operation, req }) => {
    const { locale, payload } = req
    const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs'
    const breadcrumbs = doc[breadcrumbSlug] as unknown as Breadcrumb[]

    if (operation === 'create') {
      const originalDocWithDepth0 = await payload.findByID({
        id: doc.id,
        collection: collection.slug,
        depth: 0,
        req,
      })

      const updateAsDraft =
        typeof collection.versions === 'object' &&
        collection.versions.drafts &&
        doc._status !== 'published'

      try {
        await payload.update({
          id: doc.id,
          collection: collection.slug,
          data: {
            ...originalDocWithDepth0,
            [breadcrumbSlug]:
              breadcrumbs?.map((crumb, i) => ({
                ...crumb,
                doc: breadcrumbs.length === i + 1 ? doc.id : crumb.doc,
              })) || [],
          },
          depth: 0,
          draft: updateAsDraft,
          locale,
          req,
        })
      } catch (err: unknown) {
        payload.logger.error(
          `Nested Docs plugin has had an error while adding breadcrumbs during document creation.`,
        )
        payload.logger.error(err)
      }
    }

    return undefined
  }
