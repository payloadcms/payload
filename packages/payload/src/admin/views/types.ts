import type { ClientTranslationsObject } from '@payloadcms/translations'

import type { SanitizedPermissions } from '../../auth/index.js'
import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ClientConfig } from '../../config/client.js'
import type {
  CustomComponent,
  Locale,
  MetaConfig,
  PayloadComponent,
  SanitizedConfig,
  ServerProps,
} from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { LanguageOptions } from '../LanguageOptions.js'
import type { Data, DocumentSlots } from '../types.js'

export type AdminViewConfig = {
  Component: AdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  meta?: MetaConfig
  path?: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewProps = {
  readonly clientConfig: ClientConfig
  readonly disableActions?: boolean
  readonly documentSubViewType?: DocumentSubViewTypes
  readonly drawerSlug?: string
  readonly importMap: ImportMap
  readonly initialData?: Data
  readonly initPageResult: InitPageResult
  readonly params?: { [key: string]: string | string[] | undefined }
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly searchParams: { [key: string]: string | string[] | undefined }
  readonly viewType: ViewTypes
}

export type AdminViewComponent = PayloadComponent<AdminViewProps>

export type EditViewProps = {
  readonly collectionSlug?: string
  readonly globalSlug?: string
}

export type VisibleEntities = {
  collections: SanitizedCollectionConfig['slug'][]
  globals: SanitizedGlobalConfig['slug'][]
}

export type InitPageResult = {
  collectionConfig?: SanitizedCollectionConfig
  cookies: Map<string, string>
  docID?: number | string
  globalConfig?: SanitizedGlobalConfig
  languageOptions: LanguageOptions
  locale?: Locale
  permissions: SanitizedPermissions
  redirectTo?: string
  req: PayloadRequest
  translations: ClientTranslationsObject
  visibleEntities: VisibleEntities
}

export type ServerSideEditViewProps = {
  readonly doc: Data
  readonly initPageResult: InitPageResult
  readonly routeSegments: string[]
} & ClientSideEditViewProps &
  ServerProps

export type ClientSideEditViewProps = {} & DocumentSlots

export type ViewTypes =
  | 'account'
  | 'dashboard'
  | 'document'
  | 'list'
  | 'reset'
  | 'verify'
  | 'version'
export type DocumentSubViewTypes = 'api' | 'default' | 'livePreview' | 'version' | 'versions'

export type ServerPropsFromView = {
  collectionConfig?: SanitizedConfig['collections'][number]
  globalConfig?: SanitizedConfig['globals'][number]
  viewActions: CustomComponent[]
}
