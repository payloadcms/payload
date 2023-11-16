import type { useLocation, useRouteMatch } from 'react-router-dom'

import type { Config } from '../../../../../exports/config'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { useConfig } from '../../../utilities/Config'
import type { useDocumentInfo } from '../../../utilities/DocumentInfo'
import type { ContextType } from '../../../utilities/DocumentInfo/types'

export type DocumentTabProps = {
  apiURL?: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id: string
  isEditing?: boolean
}

export type DocumentTabCondition = (args: {
  collection: SanitizedCollectionConfig
  config: Config
  documentInfo: ContextType
  global: SanitizedGlobalConfig
}) => boolean

// Everything is optional because we merge in the defaults
// i.e. the config may override the `Default` view with a `label` but not an `href`
export type DocumentTabConfig = {
  condition?: DocumentTabCondition
  href?:
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
  label?: ((args: { t: (key: string) => string }) => string) | string
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
