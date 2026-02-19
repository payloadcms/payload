import type { Config } from '../config/types.js'

/**
 * Add a sidebar tab for each hierarchy collection (tags/taxonomy).
 * Each tab shows the tree for that specific hierarchy.
 * Folders use FolderSidebarTab so they're handled separately.
 *
 * Note: Hierarchy relationship fields are validated earlier in config sanitization
 * (see validateHierarchyFields called from config/sanitize.ts)
 */
export const addHierarchySidebarTabs = (config: Config): void => {
  // Find all collections with hierarchy enabled and allowHasMany: true (tags/taxonomy)
  // Folders (allowHasMany: false) use FolderSidebarTab
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
      const icon = collection.hierarchy?.admin?.components?.Icon || '@payloadcms/ui#TagIcon'

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
