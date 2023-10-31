import type { collectionViewType } from '../../../views/collections/Edit/Routes/CustomComponent'
import type { DocumentTabConfig } from './types'

export const tabs: Record<collectionViewType, DocumentTabConfig> = {
  API: {
    condition: ({ collection, global }) =>
      (collection && !collection?.admin?.hideAPIURL) || (global && !global?.admin?.hideAPIURL),
    href: '/api',
    label: 'API',
  },
  Default: {
    href: '',
    isActive: ({ href, location }) =>
      location.pathname === href || location.pathname === `${href}/create`,
    label: ({ t }) => t('edit'),
  },
  LivePreview: {
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
  References: {
    condition: () => false,
  },
  Relationships: {
    condition: () => false,
  },
  Version: {
    condition: () => false,
  },
  Versions: {
    condition: ({ collection, global }) => Boolean(collection?.versions || global?.versions),
    href: '/versions',
    label: ({ t }) => t('version:versions'),
    pillLabel: ({ versions }) =>
      typeof versions?.totalDocs === 'number' && versions?.totalDocs > 0
        ? versions?.totalDocs.toString()
        : '',
  },
}
