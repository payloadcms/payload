import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../types'

import populateBreadcrumbs from '../utilities/populateBreadcrumbs'

const resaveChildren =
  (pluginConfig: PluginConfig, collection: CollectionConfig): CollectionAfterChangeHook =>
  async ({ doc, req: { locale, payload }, req }) => {
    const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
    const resaveChildrenAsync = async (): Promise<void> => {
      const children = await payload.find({
        collection: collection.slug,
        depth: 0,
        locale,
        req,
        where: {
          [parentSlug]: {
            equals: doc.id,
          },
        },
      })

      const breadcrumbSlug = pluginConfig.breadcrumbsFieldSlug || 'breadcrumbs'

      try {
        children.docs.forEach(async (child: any) => {
          const updateAsDraft =
            typeof collection.versions === 'object' &&
            collection.versions.drafts &&
            child._status !== 'published'

          await payload.update({
            id: child.id,
            collection: collection.slug,
            data: {
              ...child,
              [breadcrumbSlug]: await populateBreadcrumbs(req, pluginConfig, collection, child),
            },
            depth: 0,
            draft: updateAsDraft,
            locale,
            req,
          })
        })
      } catch (err: unknown) {
        payload.logger.error(
          `Nested Docs plugin has had an error while re-saving a child document.`,
        )
        payload.logger.error(err)
      }
    }

    await resaveChildrenAsync()

    return undefined
  }

export default resaveChildren
