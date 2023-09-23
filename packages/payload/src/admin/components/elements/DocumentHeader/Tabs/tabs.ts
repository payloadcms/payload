import type { DocumentTabConfig } from './types'

export const tabs: DocumentTabConfig[] = [
  // Default
  {
    href: '',
    isActive: ({ href, location }) =>
      location.pathname === href || location.pathname === `${href}/create`,
    label: ({ t }) => t('edit'),
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
      !collection?.admin?.hideAPIURL || !global?.admin?.hideAPIURL,
    href: ({ apiURL }) => apiURL,
    label: 'API',
    newTab: true,
  },
]
