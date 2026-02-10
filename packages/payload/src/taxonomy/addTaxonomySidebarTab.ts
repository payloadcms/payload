import type { Config } from '../config/types.js'

/**
 * Add a sidebar tab for each taxonomy collection
 * Each tab shows the tree for that specific taxonomy
 *
 * Note: Taxonomy relationship fields are injected earlier in config sanitization
 * (see injectTaxonomyFields called from config/sanitize.ts)
 */
export const addTaxonomySidebarTabs = (config: Config): void => {
  // Find all collections with taxonomy enabled
  const taxonomyCollections = config.collections?.filter((collection) => collection.taxonomy)

  if (!taxonomyCollections || taxonomyCollections.length === 0) {
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

  // Add a tab for each taxonomy collection
  for (const collection of taxonomyCollections) {
    const tabSlug = `taxonomy-${collection.slug}`

    // Check if tab already exists
    const hasTab = config.admin.components.sidebar.tabs.some((tab) => tab.slug === tabSlug)

    if (!hasTab) {
      const icon = collection.taxonomy?.icon || '@payloadcms/ui#TagIcon'

      config.admin.components.sidebar.tabs.push({
        slug: tabSlug,
        component: {
          clientProps: {
            collectionSlug: collection.slug,
          },
          path: '@payloadcms/ui/rsc#TaxonomySidebarTabServer',
        },
        icon,
        label: collection.labels?.plural || collection.slug,
      })
    }
  }
}
