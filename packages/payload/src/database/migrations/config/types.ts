export type ConfigFieldState = {
  localized: boolean
}

export type ConfigEntityState = {
  autosave: boolean
  drafts: boolean
  fields: Record<string, ConfigFieldState>
  localizeStatus: boolean
  versions: boolean
}

export type ConfigSnapshot = {
  collections: Record<string, ConfigEntityState>
  globals: Record<string, ConfigEntityState>
  localization: {
    defaultLocale: string
    locales: string[]
  }
  version: 1
}

export type ConfigChange =
  | { entity: 'collection' | 'global'; slug: string; type: 'autosave_enabled' }
  | { entity: 'collection' | 'global'; slug: string; type: 'drafts_disabled' }
  | { entity: 'collection' | 'global'; slug: string; type: 'versions_disabled' }
  | { entity: 'collection' | 'global'; slug: string; type: 'versions_enabled' }
  | {
      entity: 'collection' | 'global'
      fieldPath: string
      slug: string
      type: 'field_delocalized'
    }
  | {
      entity: 'collection' | 'global'
      fieldPath: string
      slug: string
      type: 'field_localized'
    }
  | {
      entity: 'collection' | 'global'
      initialStatus: 'draft' | 'published'
      slug: string
      type: 'drafts_enabled'
    }
  | {
      entity: 'collection' | 'global'
      slug: string
      type: 'localize_status_enabled'
    }
  | { from: string; to: string; type: 'default_locale_changed' }
  | { locale: string; type: 'locale_added' }
  | { locale: string; type: 'locale_removed' }
