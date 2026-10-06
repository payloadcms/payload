import type { CollectionAfterChangeHook } from 'payload'

import type { Breadcrumb, NestedDocsPluginConfig } from '../types.js'

// This hook automatically re-saves a document after it is created
// so that we can build its breadcrumbs with the newly created document's ID.

export const resaveSelfAfterCreate =
  (pluginConfig: NestedDocsPluginConfig): CollectionAfterChangeHook =>
  async ({ collection, doc, operation, req }) => {
    if (operation !== 'create') {
      return undefined
    }

    const { locale, payload } = req
    const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs'
    const breadcrumbs = doc[breadcrumbSlug] as
      | Breadcrumb[]
      | Record<string, Breadcrumb[]>
      | undefined
    const repairBreadcrumbs = ({ breadcrumbs }: { breadcrumbs?: Breadcrumb[] }): Breadcrumb[] =>
      breadcrumbs?.map((crumb, index) => ({
        ...crumb,
        doc: breadcrumbs.length === index + 1 ? doc.id : crumb.doc,
      })) || []
    const repairedBreadcrumbs =
      Array.isArray(breadcrumbs) || !breadcrumbs
        ? repairBreadcrumbs({ breadcrumbs })
        : Object.fromEntries(
            Object.entries(breadcrumbs).map(([locale, breadcrumbs]) => [
              locale,
              repairBreadcrumbs({ breadcrumbs }),
            ]),
          )

    try {
      await payload.update({
        id: doc.id,
        collection: collection.slug,
        data: {
          [breadcrumbSlug]: repairedBreadcrumbs,
        },
        depth: 0,
        locale,
        overrideAccess: true,
        req,
        version: collection?.versions?.drafts ? 'latest' : 'published',
      })
    } catch (err: unknown) {
      payload.logger.error(
        `Nested Docs plugin has had an error while adding breadcrumbs during document creation.`,
      )
      payload.logger.error(err)
    }
  }
