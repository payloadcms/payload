import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type { I18n } from '@payloadcms/translations'
import type { useDocumentInfo } from '../../../providers/DocumentInfo'
import type { ContextType } from '../../../providers/DocumentInfo/types'

export type DocumentTabProps = {
  apiURL?: string
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id: string
  isEditing?: boolean
  i18n: I18n
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
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
        routes: SanitizedConfig['routes']
      }) => string)
    | string
  isActive?: boolean
  // isActive?: ((args: { href: string }) => boolean) | boolean
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
