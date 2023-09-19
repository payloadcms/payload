import type { useLocation, useRouteMatch } from 'react-router-dom'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { useConfig } from '../../../utilities/Config'
import type { useDocumentInfo } from '../../../utilities/DocumentInfo'

export type FilterType = (args: {
  collection: SanitizedCollectionConfig
  global: SanitizedGlobalConfig
}) => boolean

type TabType = {
  condition?: FilterType
  href?: (args: {
    apiURL: string
    collection: SanitizedCollectionConfig
    global: SanitizedGlobalConfig
    id?: string
    match: ReturnType<typeof useRouteMatch>
    routes: ReturnType<typeof useConfig>['routes']
  }) => string
  isActive?: (args: {
    href: string
    location: ReturnType<typeof useLocation>
    match: ReturnType<typeof useRouteMatch>
  }) => boolean
  label: ((args: { t: (key: string) => string }) => string) | string
  newTab?: boolean
  pillLabel?:
    | ((args: { versions: ReturnType<typeof useDocumentInfo>['versions'] }) => string)
    | string
}

export const tabs: TabType[] = [
  // Default
  {
    href: ({ match }) => `${match.url}`,
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
    href: ({ match }) => `${match.url}/versions`,
    isActive: ({ href, location }) => location.pathname.startsWith(href),
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
    isActive: ({ href, location }) => location.pathname.startsWith(href),
    label: 'API',
    newTab: true,
  },
]
