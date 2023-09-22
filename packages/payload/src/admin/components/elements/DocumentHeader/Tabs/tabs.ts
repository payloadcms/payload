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
    condition: ({ collection, global }) =>
      Boolean(collection?.admin?.livePreview || global?.admin?.livePreview),
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
      !collection?.admin?.hideAPIURL || !global?.admin?.hideAPIURL,
    href: ({ apiURL }) => apiURL,
    label: 'API',
    newTab: true,
  },
]
