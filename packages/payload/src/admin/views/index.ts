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
import type { Data, StaticDescription } from '../types.js'
import type { DocumentSubViewTypes } from './document.js'

export type AdminViewConfig = {
  Component: PayloadComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  meta?: MetaConfig
  path?: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewClientProps = {
  browseByFolderSlugs?: SanitizedCollectionConfig['slug'][]
  clientConfig: ClientConfig
  documentSubViewType?: DocumentSubViewTypes
  viewType: ViewTypes
}

export type AdminViewServerPropsOnly = {
  readonly clientConfig: ClientConfig
  readonly disableActions?: boolean
  /**
   * @todo remove `docID` here as it is already contained in `initPageResult`
   */
  readonly docID?: number | string
  readonly folderID?: number | string
  readonly importMap: ImportMap
  readonly initialData?: Data
  readonly initPageResult: InitPageResult
  readonly params?: { [key: string]: string | string[] | undefined }
  readonly redirectAfterCreate?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
} & ServerProps

export type AdminViewServerProps = AdminViewClientProps & AdminViewServerPropsOnly

/**
 * @deprecated This should be removed in favor of direct props
 */
export type AdminViewComponent = PayloadComponent<AdminViewServerProps>

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

/**
 * @todo This should be renamed to `ViewType` (singular)
 */
export type ViewTypes =
  | 'account'
  | 'collection-folders'
  | 'dashboard'
  | 'document'
  | 'folders'
  | 'list'
  | 'reset'
  | 'verify'
  | 'version'

export type ServerPropsFromView = {
  collectionConfig?: SanitizedConfig['collections'][number]
  globalConfig?: SanitizedConfig['globals'][number]
  viewActions: CustomComponent[]
}

// Description
export type ViewDescriptionClientProps = {
  collectionSlug?: SanitizedCollectionConfig['slug']
  description: StaticDescription
}

export type ViewDescriptionServerPropsOnly = {} & ServerProps

export type ViewDescriptionServerProps = ViewDescriptionClientProps & ViewDescriptionServerPropsOnly
