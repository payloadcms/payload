import type { Config } from '../config/types.js'

/**
 * Add a sidebar tab for each hierarchy collection with allowHasMany: true (tags).
 * Each tab shows the tree for that specific hierarchy.
 * Folders (allowHasMany: false) use FolderSidebarTab.
 */
export const addTagSidebarTabs = (config: Config): void => {
  // Find all collections with hierarchy enabled and allowHasMany: true (tags)
  const hierarchyCollections = config.collections?.filter(
    (collection) =>
      collection.hierarchy &&
      typeof collection.hierarchy === 'object' &&
      collection.hierarchy.allowHasMany !== false,
  )

  if (!hierarchyCollections || hierarchyCollections.length === 0) {
    return
  }

  // Initialize admin config structure
  if (!config.admin) {
    config.admin = {}
  }
  if (!config.admin.components) {
    config.admin.components = {}
  }
  if (!config.admin.components.sidebar) {
    config.admin.components.sidebar = {}
  }
  if (!config.admin.components.sidebar.tabs) {
    config.admin.components.sidebar.tabs = []
  }

  // Add a tab for each hierarchy collection
  for (const collection of hierarchyCollections) {
    const tabSlug = `hierarchy-${collection.slug}`

    // Check if tab already exists
    const hasTab = config.admin.components.sidebar.tabs.some((tab) => tab.slug === tabSlug)

    if (!hasTab) {
      const hierarchyConfig =
        typeof collection.hierarchy === 'object' ? collection.hierarchy : undefined
      const icon = hierarchyConfig?.admin?.components?.Icon || '@payloadcms/ui#TagIcon'

      config.admin.components.sidebar.tabs.push({
        slug: tabSlug,
        component: {
          clientProps: {
            collectionSlug: collection.slug,
          },
          path: '@payloadcms/ui/rsc#HierarchySidebarTabServer',
        },
        icon,
        label: collection.labels?.plural || collection.slug,
      })
    }
  }
}
