import type { ClientTranslationsObject } from '@payloadcms/translations'

import type { Permissions } from '../../auth/index.js'
import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ClientConfig } from '../../config/client.js'
import type { Locale, MetaConfig, PayloadComponent } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { LanguageOptions } from '../LanguageOptions.js'
import type { ClientDocumentTabConfig, MappedComponent } from '../types.js'

export type AdminViewConfig = {
  Component: AdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  meta?: MetaConfig
  path?: string
  sensitive?: boolean
  strict?: boolean
}

export type MappedView = {
  actions?: MappedComponent[]
  Component: MappedComponent
  tab?: ClientDocumentTabConfig
}

export type AdminViewProps = {
  readonly clientConfig: ClientConfig
  readonly importMap: ImportMap
  readonly initPageResult: InitPageResult
  readonly params?: { [key: string]: string | string[] | undefined }
  readonly searchParams: { [key: string]: string | string[] | undefined }
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
  docID?: string
  globalConfig?: SanitizedGlobalConfig
  languageOptions: LanguageOptions
  locale?: Locale
  permissions: Permissions
  req: PayloadRequest
  translations: ClientTranslationsObject
  visibleEntities: VisibleEntities
}

export type ServerSideEditViewProps = {
  readonly initPageResult: InitPageResult
  readonly params: { [key: string]: string | string[] | undefined }
  readonly routeSegments: string[]
  readonly searchParams: { [key: string]: string | string[] | undefined }
}
