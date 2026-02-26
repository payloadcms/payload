import type React from 'react'

import type { Condition, Validate } from '../fields/config/types.js'

// ─── Field-level config ───

export type FieldComponentConfig = {
  AfterInput?: React.ComponentType | React.ComponentType[] | React.ReactNode
  BeforeInput?: React.ComponentType | React.ComponentType[] | React.ReactNode
  Cell?: React.ComponentType | React.ReactNode
  Description?: React.ComponentType | React.ReactNode
  Error?: React.ComponentType | React.ReactNode
  Field?: React.ComponentType | React.ReactNode
  Filter?: React.ComponentType | React.ReactNode
  Label?: React.ComponentType | React.ReactNode
}

export type FieldConfig = {
  components?: FieldComponentConfig
  condition?: Condition
  defaultValue?: (() => unknown) | unknown
  filterOptions?: (options: any) => any
  validate?: Validate
}

// ─── Admin-level config ───

type AdminViewConfig = {
  Component: React.ComponentType | React.ReactNode
  exact?: boolean
  meta?: { title?: string }
  path: string
  strict?: boolean
}

export type AdminComponentsConfig = {
  actions?: (React.ComponentType | React.ReactNode)[]
  afterDashboard?: (React.ComponentType | React.ReactNode)[]
  afterLogin?: (React.ComponentType | React.ReactNode)[]
  afterNav?: (React.ComponentType | React.ReactNode)[]
  afterNavLinks?: (React.ComponentType | React.ReactNode)[]
  avatar?: React.ComponentType | React.ReactNode
  beforeDashboard?: (React.ComponentType | React.ReactNode)[]
  beforeLogin?: (React.ComponentType | React.ReactNode)[]
  beforeNav?: (React.ComponentType | React.ReactNode)[]
  beforeNavLinks?: (React.ComponentType | React.ReactNode)[]
  graphics?: {
    Icon?: React.ComponentType | React.ReactNode
    Logo?: React.ComponentType | React.ReactNode
  }
  header?: (React.ComponentType | React.ReactNode)[]
  logout?: {
    Button?: React.ComponentType | React.ReactNode
  }
  Nav?: React.ComponentType | React.ReactNode
  providers?: (React.ComponentType<{ children?: React.ReactNode }> | React.ReactNode)[]
  settingsMenu?: (React.ComponentType | React.ReactNode)[]
  views?: Record<string, AdminViewConfig>
}

// ─── Collection-level config ───

export type CollectionComponentsConfig = {
  afterList?: (React.ComponentType | React.ReactNode)[]
  afterListTable?: (React.ComponentType | React.ReactNode)[]
  beforeList?: (React.ComponentType | React.ReactNode)[]
  beforeListTable?: (React.ComponentType | React.ReactNode)[]
  Description?: React.ComponentType | React.ReactNode
  edit?: {
    beforeDocumentControls?: (React.ComponentType | React.ReactNode)[]
    editMenuItems?: (React.ComponentType | React.ReactNode)[]
    PreviewButton?: React.ComponentType | React.ReactNode
    PublishButton?: React.ComponentType | React.ReactNode
    SaveButton?: React.ComponentType | React.ReactNode
    SaveDraftButton?: React.ComponentType | React.ReactNode
    Status?: React.ComponentType | React.ReactNode
    UnpublishButton?: React.ComponentType | React.ReactNode
    Upload?: React.ComponentType | React.ReactNode
  }
  listMenuItems?: (React.ComponentType | React.ReactNode)[]
  views?: Record<string, any>
}

// ─── Global-level config ───

export type GlobalComponentsConfig = {
  Description?: React.ComponentType | React.ReactNode
  elements?: {
    beforeDocumentControls?: (React.ComponentType | React.ReactNode)[]
    PreviewButton?: React.ComponentType | React.ReactNode
    PublishButton?: React.ComponentType | React.ReactNode
    SaveButton?: React.ComponentType | React.ReactNode
    SaveDraftButton?: React.ComponentType | React.ReactNode
    Status?: React.ComponentType | React.ReactNode
    UnpublishButton?: React.ComponentType | React.ReactNode
  }
  views?: Record<string, any>
}

// ─── Combined admin config (single file, no directive) ───

export type AdminConfig = {
  admin?: AdminComponentsConfig
  collections?: Record<string, CollectionComponentsConfig>
  fields?: Record<string, FieldConfig>
  globals?: Record<string, GlobalComponentsConfig>
}

// ─── Shared config (optional, for validators that run on both client and server) ───

export type SharedFieldConfig = {
  validate?: Validate
}

export type SharedAdminConfig = {
  fields?: Record<string, SharedFieldConfig>
}

// ─── Builder functions ───

export function defineAdminConfig<TConfig extends AdminConfig>(config: TConfig): TConfig {
  return config
}

export function defineSharedConfig<TConfig extends SharedAdminConfig>(config: TConfig): TConfig {
  return config
}
