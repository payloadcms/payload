import type { SupportedLanguages } from '@payloadcms/translations'

import type { Permissions } from '../../auth/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Locale } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

export type AdminViewConfig = {
  Component: AdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  path: string
  sensitive?: boolean
  strict?: boolean
  templateClass?: string
  /** @default 'none' */
  templateType?: 'default' | 'minimal' | 'none'
}

export type AdminViewProps = {
  initPageResult: InitPageResult
  params?: { [key: string]: string | string[] | undefined }
  searchParams: { [key: string]: string | string[] | undefined }
}

export type AdminViewComponent = React.ComponentType<AdminViewProps>

export type AdminView = AdminViewComponent | AdminViewConfig

export type EditViewProps = {
  collectionSlug?: string
  globalSlug?: string
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
  locale: Locale
  permissions: Permissions
  req: PayloadRequest
  translations: SupportedLanguages
  visibleEntities: VisibleEntities
}

export type ServerSideEditViewProps = {
  initPageResult: InitPageResult
  params: { [key: string]: string | string[] | undefined }
  routeSegments: string[]
  searchParams: { [key: string]: string | string[] | undefined }
}
