import type { I18n } from '@payloadcms/translations'

import type { Permissions } from '../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Payload } from '../../index.js'

export type DocumentTabProps = {
  readonly apiURL?: string
  readonly collectionConfig?: SanitizedCollectionConfig
  readonly globalConfig?: SanitizedGlobalConfig
  readonly i18n: I18n
  readonly payload: Payload
  readonly permissions: Permissions
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
  readonly Component?: DocumentTabComponent
  readonly condition?: DocumentTabCondition
  readonly href?:
    | ((args: {
        apiURL: string
        collection: SanitizedCollectionConfig
        global: SanitizedGlobalConfig
        id?: string
        routes: SanitizedConfig['routes']
      }) => string)
    | string
  readonly isActive?: ((args: { href: string }) => boolean) | boolean
  readonly label?: ((args: { t: (key: string) => string }) => string) | string
  readonly newTab?: boolean
  readonly Pill?: PayloadComponent
}

export type ClientDocumentTabConfig = {
  condition?: never
  isActive?: boolean
  label?: string
} & DocumentTabConfig

export type DocumentTabComponent = PayloadComponent<{
  path: string
}>
