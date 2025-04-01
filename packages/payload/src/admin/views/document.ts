import type { SanitizedPermissions } from '../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadComponent, SanitizedConfig, ServerProps } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Data, DocumentSlots, FormState } from '../types.js'
import type { InitPageResult, ViewTypes } from './index.js'

export type EditViewProps = {
  readonly collectionSlug?: string
  readonly globalSlug?: string
}

export type DocumentViewServerPropsOnly = {
  readonly doc: Data
  readonly initPageResult: InitPageResult
  readonly routeSegments: string[]
} & ServerProps

export type DocumentViewServerProps = DocumentViewClientProps & DocumentViewServerPropsOnly

export type DocumentViewClientProps = {
  documentSubViewType: DocumentSubViewTypes
  formState: FormState
  viewType: ViewTypes
} & DocumentSlots

/**
 * @todo: This should be renamed to `DocumentSubViewType` (singular)
 */
export type DocumentSubViewTypes = 'api' | 'default' | 'livePreview' | 'version' | 'versions'

export type DocumentTabServerPropsOnly = {
  readonly apiURL?: string
  readonly collectionConfig?: SanitizedCollectionConfig
  readonly globalConfig?: SanitizedGlobalConfig
  readonly permissions: SanitizedPermissions
} & ServerProps

export type DocumentTabServerProps = DocumentTabClientProps & DocumentTabServerPropsOnly

export type DocumentTabClientProps = {
  path: string
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  permissions: SanitizedPermissions
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

/**
 * @todo: Remove this type as it's only used internally for the config (above)
 */
export type DocumentTabComponent = PayloadComponent<{
  path: string
}>
