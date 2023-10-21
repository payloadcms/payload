import type { DocumentTabConfig } from './types'

export const tabs: DocumentTabConfig[] = [
  // Default
  {
    href: '',
    isActive: ({ href, location }) =>
      location.pathname === href || location.pathname === `${href}/create`,
    label: ({ t }) => t('edit'),
  },
  // Live Preview
  {
    condition: ({ collection, config, global }) => {
      if (collection) {
        return Boolean(
          config?.admin?.livePreview?.collections?.includes(collection.slug) ||
            collection?.admin?.livePreview,
        )
      }

      if (global) {
        return Boolean(
          config?.admin?.livePreview?.globals?.includes(global.slug) || global?.admin?.livePreview,
        )
      }

      return false
    },
    href: ({ match }) => `${match.url}/preview`,
    isActive: ({ href, location }) => location.pathname === href,
    label: ({ t }) => t('livePreview'),
  },
  // Versions
  {
    condition: ({ collection, global }) => Boolean(collection?.versions || global?.versions),
    href: '/versions',
    label: ({ t }) => t('version:versions'),
    pillLabel: ({ versions }) =>
      typeof versions?.totalDocs === 'number' && versions?.totalDocs > 0
        ? versions?.totalDocs.toString()
        : '',
  },
  // API
  {
    condition: ({ collection, global }) =>
      (collection && !collection?.admin?.hideAPIURL) || (global && !global?.admin?.hideAPIURL),
    href: '/api',
    label: 'API',
  },
]
