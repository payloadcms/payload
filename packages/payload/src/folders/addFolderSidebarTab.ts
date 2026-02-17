import type { Config } from '../config/types.js'

/**
 * Add a sidebar tab for folders if any collections have folders enabled.
 * The tab shows a tree view for navigating folder structure.
 */
export const addFolderSidebarTab = (config: Config): void => {
  // Check if folders feature is enabled
  if (config.folders === false) {
    return
  }

  // Find collections with folder config
  const folderCollections = config.collections?.filter((collection) => collection.folders)

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

  const tabSlug = 'folders'

  // Check if tab already exists
  const hasTab = config.admin.components.sidebar.tabs.some((tab) => tab.slug === tabSlug)

  if (!hasTab) {
    config.admin.components.sidebar.tabs.push({
      slug: tabSlug,
      component: {
        clientProps: {
          folderCollectionSlug: config.folders!.slug,
        },
        path: '@payloadcms/ui/rsc#FolderSidebarTabServer',
      },
      icon: '@payloadcms/ui#FolderIcon',
      label: 'Folders',
    })
  }
}
