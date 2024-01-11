import type { I18n } from '@payloadcms/translations'

import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { Document } from '../../types'
import type { DocumentInfoContext } from '../providers/DocumentInfo'

export type DocumentTabProps = {
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  id: string
  isEditing?: boolean
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  documentInfo: DocumentInfoContext
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
  pillLabel?: ((args: { versions: Document }) => string) | string
}

export type DocumentTabComponent = React.ComponentType<
  DocumentTabProps & {
    path: string
  }
>

export type DocumentTab = DocumentTabComponent | DocumentTabConfig
