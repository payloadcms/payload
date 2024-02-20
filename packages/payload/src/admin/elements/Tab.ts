import type { I18n } from '@payloadcms/translations'

import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'

export type DocumentTabProps = {
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
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
