import type { useLocation, useRouteMatch } from 'react-router-dom'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { useConfig } from '../../../utilities/Config'
import type { useDocumentInfo } from '../../../utilities/DocumentInfo'

export type DocumentTabProps = {
  apiURL?: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id: string
  isEditing?: boolean
}

export type DocumentTabCondition = (args: {
  collection: SanitizedCollectionConfig
  global: SanitizedGlobalConfig
}) => boolean

export type DocumentTabConfig = {
  condition?: DocumentTabCondition
  href:
    | ((args: {
        apiURL: string
        collection: SanitizedCollectionConfig
        global: SanitizedGlobalConfig
        id?: string
        match: ReturnType<typeof useRouteMatch>
        routes: ReturnType<typeof useConfig>['routes']
      }) => string)
    | string
  isActive?:
    | ((args: {
        href: string
        location: ReturnType<typeof useLocation>
        match: ReturnType<typeof useRouteMatch>
      }) => boolean)
    | boolean
  label: ((args: { t: (key: string) => string }) => string) | string
  newTab?: boolean
  pillLabel?:
    | ((args: { versions: ReturnType<typeof useDocumentInfo>['versions'] }) => string)
    | string
}

export type DocumentTabComponent = React.ComponentType<
  DocumentTabProps & {
    path: string
  }
>

export type DocumentTab = DocumentTabComponent | DocumentTabConfig
