import type { Config } from '../config/types.js'

/**
 * Add a sidebar tab for each folder collection.
 * Each tab shows the tree for that specific folder collection.
 */
export const addFolderSidebarTabs = (config: Config): void => {
  // Find all collections with folder enabled
  const folderCollections = config.collections?.filter(
    (collection) => collection.folder && typeof collection.folder === 'object',
  )

  if (!folderCollections || folderCollections.length === 0) {
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

  // Add a tab for each folder collection
  for (const collection of folderCollections) {
    const tabSlug = `folder-${collection.slug}`

    // Check if tab already exists
    const hasTab = config.admin.components.sidebar.tabs.some((tab) => tab.slug === tabSlug)

    if (!hasTab) {
      config.admin.components.sidebar.tabs.push({
        slug: tabSlug,
        component: {
          clientProps: {
            collectionSlug: collection.slug,
          },
          path: '@payloadcms/ui/rsc#FolderSidebarTabServer',
        },
        icon: '@payloadcms/ui#FolderIcon',
        label: collection.labels?.plural || collection.slug,
      })
    }
  }
}
