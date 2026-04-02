import type {
  ClientConfig,
  DocumentSubViewTypes,
  Locale,
  NavPreferences,
  PayloadComponent,
  SanitizedPermissions,
  ViewTypes,
  VisibleEntities,
} from 'payload'

export type SerializableRouteParams = {
  collection?: string
  folderCollection?: string
  folderID?: number | string
  global?: string
  id?: number | string
  token?: string
  versionID?: number | string
}

export type LoginPageData = {
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
}

export type CreateFirstUserPageData = {
  docPermissions: Record<string, unknown>
  docPreferences: Record<string, unknown>
  initialState: Record<string, unknown>
  loginWithUsername?: false | Record<string, unknown>
  userSlug: string
}

export type VerifyPageData = {
  isVerified: boolean
  message: string
}

export type SerializablePageData = {
  createFirstUser?: CreateFirstUserPageData
  login?: LoginPageData
  verify?: VerifyPageData
}

export type SerializablePageState = {
  browseByFolderSlugs: string[]
  clientConfig: ClientConfig
  customView?: PayloadComponent
  documentSubViewType?: DocumentSubViewTypes
  locale?: Locale
  navPreferences?: NavPreferences
  pageData?: SerializablePageData
  permissions: SanitizedPermissions
  routeParams: SerializableRouteParams
  searchParams?: Record<string, string | string[]>
  segments: string[]
  templateClassName: string
  templateType?: 'default' | 'minimal'
  unsupportedCustomView?: boolean
  viewActions?: PayloadComponent[]
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
}
