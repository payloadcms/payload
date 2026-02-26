import type React from 'react'

import type { Condition, Validate } from '../fields/config/types.js'

// ─── Field-level config ───

export type ClientFieldComponentConfig = {
  AfterInput?: React.ComponentType | React.ComponentType[]
  BeforeInput?: React.ComponentType | React.ComponentType[]
  Cell?: React.ComponentType
  Description?: React.ComponentType | React.ReactNode
  Error?: React.ComponentType | React.ReactNode
  Field?: React.ComponentType
  Filter?: React.ComponentType
  Label?: React.ComponentType | React.ReactNode
}

export type ClientFieldConfig = {
  components?: ClientFieldComponentConfig
  condition?: Condition
  defaultValue?: (() => unknown) | unknown
  filterOptions?: (options: any) => any
  validate?: Validate
}

export type RscFieldComponentConfig = {
  AfterInput?: React.ReactNode
  BeforeInput?: React.ReactNode
  Description?: React.ReactNode
  Error?: React.ReactNode
  Field?: React.ReactNode
  Label?: React.ReactNode
}

export type RscFieldConfig = {
  components?: RscFieldComponentConfig
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

// ─── Combined configs ───

export type ClientAdminConfig = {
  admin?: AdminComponentsConfig
  collections?: Record<string, CollectionComponentsConfig>
  fields?: Record<string, ClientFieldConfig>
  globals?: Record<string, GlobalComponentsConfig>
}

export type RscAdminConfig = {
  admin?: AdminComponentsConfig
  collections?: Record<string, CollectionComponentsConfig>
  fields?: Record<string, RscFieldConfig>
  globals?: Record<string, GlobalComponentsConfig>
}

export type SharedFieldConfig = {
  validate?: Validate
}

export type SharedAdminConfig = {
  fields?: Record<string, SharedFieldConfig>
}

// ─── Builder functions ───

export function defineClientConfig<TConfig extends ClientAdminConfig>(config: TConfig): TConfig {
  return config
}

export function defineRscConfig<TConfig extends RscAdminConfig>(config: TConfig): TConfig {
  return config
}

export function defineSharedConfig<TConfig extends SharedAdminConfig>(config: TConfig): TConfig {
  return config
}

// ─── Deprecated aliases ───

/** @deprecated Use `ClientAdminConfig` instead. */
export type AdminConfig = ClientAdminConfig
/** @deprecated Use `ClientFieldConfig` instead. */
export type AdminFieldConfig = ClientFieldConfig
/** @deprecated Use `ClientFieldComponentConfig` instead. */
export type AdminFieldComponentConfig = ClientFieldComponentConfig
/** @deprecated Use `defineClientConfig` instead. */
export const buildClientConfig = defineClientConfig
