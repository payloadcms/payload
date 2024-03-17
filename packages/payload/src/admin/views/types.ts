import type { Translations } from '@payloadcms/translations'

import type { Permissions } from '../../auth/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import { Data, DocumentTab, FormState } from '../types.js'

export type ServerSideEditViewComponent = React.ComponentType<ServerSideEditViewProps>

export type ClientSideEditViewComponent = React.ComponentType<ClientSideEditViewProps>

export type AdminViewConfig = {
  Component: RootAdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  path: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewProps = {
  initPageResult: InitPageResult
  params?: { [key: string]: string | string[] | undefined }
  searchParams: { [key: string]: string | string[] | undefined }
}

export type RootAdminViewComponent = React.ComponentType<AdminViewProps>

export type RootAdminView = RootAdminViewComponent | AdminViewConfig

export type InitPageResult = {
  collectionConfig?: SanitizedCollectionConfig
  cookies: Map<string, string>
  docID?: string
  globalConfig?: SanitizedGlobalConfig
  locale: Locale
  permissions: Permissions
  req: PayloadRequest
  translations: Translations
}

export type ClientSideEditViewProps = {
  onSave?: (data: Data) => Promise<void> | void
  initialData?: Data
  initialState?: FormState
  collectionSlug?: string
  globalSlug?: string
}

export type ServerSideEditViewProps = {
  initPageResult: InitPageResult
  routeSegments: string[]
  searchParams: { [key: string]: string | string[] | undefined }
  initialState?: FormState
  initialData?: Data
}

export type EditViewConfig =
  | {
      /**
       * Add a new Edit view to the admin panel
       * i.e. you can render a custom view that has no tab, if desired
       * Or override a specific properties of an existing one
       * i.e. you can customize the `Default` view tab label, if desired
       */
      Tab?: DocumentTab
      path?: string
    }
  | {
      Component: ServerSideEditViewComponent
      path: string
    }
  | {
      actions?: React.ComponentType<any>[]
    }

/**
 * Override existing views
 * i.e. Dashboard, Account, API, LivePreview, etc.
 * Path is not available here
 * All Tab properties become optional
 * i.e. you can change just the label, if desired
 */
export type EditView = ServerSideEditViewComponent | EditViewConfig

export type EditConfig =
  | (
      | {
          /**
           * Replace or modify individual nested routes, or add new ones:
           * + `Default` - `/admin/collections/:collection/:id`
           * + `API` - `/admin/collections/:collection/:id/api`
           * + `LivePreview` - `/admin/collections/:collection/:id/preview`
           * + `References` - `/admin/collections/:collection/:id/references`
           * + `Relationships` - `/admin/collections/:collection/:id/relationships`
           * + `Versions` - `/admin/collections/:collection/:id/versions`
           * + `Version` - `/admin/collections/:collection/:id/versions/:version`
           * + `CustomView` - `/admin/collections/:collection/:id/:path`
           */
          API?: ServerSideEditViewComponent | Partial<EditViewConfig>
          Default?: ClientSideEditViewComponent | Partial<EditViewConfig>
          LivePreview?: ServerSideEditViewComponent | Partial<EditViewConfig>
          Version?: ServerSideEditViewComponent | Partial<EditViewConfig>
          Versions?: ServerSideEditViewComponent | Partial<EditViewConfig>
          // TODO: uncomment these as they are built
          // References?: EditView
          // Relationships?: EditView
        }
      | {
          [key: string]: EditViewConfig
        }
    )
  | ClientSideEditViewComponent
