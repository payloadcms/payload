import type { useLocation, useRouteMatch } from 'react-router-dom'

import type { Config } from 'payload/config'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'
import type { useConfig } from '../../../providers/Config'
import type { useDocumentInfo } from '../../../providers/DocumentInfo'
import type { ContextType } from '../../../providers/DocumentInfo/types'

export type DocumentTabProps = {
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id: string
  isEditing?: boolean
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: Config
  documentInfo: ContextType
  globalConfig: SanitizedGlobalConfig
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
