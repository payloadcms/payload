import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../types'

import populateBreadcrumbs from '../utilities/populateBreadcrumbs'

const resaveChildren =
  (pluginConfig: PluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  ({ req: { payload, locale }, req, doc }) => {
    const resaveChildrenAsync = async (): Promise<void> => {
      const children = await payload.find({
        req,
        collection: collection.slug,
        where: {
          parent: {
            equals: doc.id,
          },
        },
        depth: 0,
        locale,
      })

      try {
        children.docs.forEach((child: any) => {
          const updateAsDraft =
            typeof collection.versions === 'object' &&
            collection.versions.drafts &&
            child._status !== 'published'

          payload.update({
            req,
            id: child.id,
            collection: collection.slug,
            draft: updateAsDraft,
            data: {
              ...child,
              breadcrumbs: populateBreadcrumbs(req, pluginConfig, collection, child),
            },
            depth: 0,
            locale,
          })
        })
      } catch (err: unknown) {
        payload.logger.error(
          `Nested Docs plugin has had an error while re-saving a child document.`,
        )
        payload.logger.error(err)
      }
    }

    // Non-blocking
    resaveChildrenAsync()

    return undefined
  }

export default resaveChildren
