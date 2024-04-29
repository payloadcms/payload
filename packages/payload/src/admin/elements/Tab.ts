import type { I18n } from '@payloadcms/translations'

import type { Permissions } from '../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'

export type DocumentTabProps = {
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  permissions: Permissions
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  permissions: Permissions
}) => boolean

// Everything is optional because we merge in the defaults
// i.e. the config may override the `Default` view with a `label` but not an `href`
export type DocumentTabConfig = {
  Pill?: React.ComponentType
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
  isActive?: ((args: { href: string }) => boolean) | boolean
  label?: ((args: { t: (key: string) => string }) => string) | string
  newTab?: boolean
}

export type DocumentTabComponent = React.ComponentType<{
  path: string
}>

export type DocumentTab = DocumentTabComponent | DocumentTabConfig
