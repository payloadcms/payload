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

export type ClientFieldConfig = {
  components?: FieldComponentConfig
  condition?: Condition
  defaultValue?: (() => unknown) | unknown
  filterOptions?: (options: any) => any
  validate?: Validate
}

export type RscFieldConfig = {
  components?: FieldComponentConfig
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

// ─── Client admin config ('use client' file) ───

export type ClientAdminConfig = {
  admin?: AdminComponentsConfig
  collections?: Record<string, CollectionComponentsConfig>
  fields?: Record<string, ClientFieldConfig>
  globals?: Record<string, GlobalComponentsConfig>
}

// ─── RSC admin config (no directive file) ───

export type RscAdminConfig = {
  admin?: AdminComponentsConfig
  collections?: Record<string, CollectionComponentsConfig>
  fields?: Record<string, RscFieldConfig>
  globals?: Record<string, GlobalComponentsConfig>
}

// ─── Shared config (no directive, auto-merged into all configs) ───

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

export function getRscSchemaPaths(rscConfig: RscAdminConfig): string[] {
  if (!rscConfig.fields) {
    return []
  }
  return Object.entries(rscConfig.fields)
    .filter(
      ([_, fieldConfig]) =>
        fieldConfig.components && Object.keys(fieldConfig.components).length > 0,
    )
    .map(([path]) => path)
}

export function mergeSharedIntoClientConfig(
  clientConfig: ClientAdminConfig,
  sharedConfig?: SharedAdminConfig,
): ClientAdminConfig {
  if (!sharedConfig?.fields) {
    return clientConfig
  }

  const merged: ClientAdminConfig = { ...clientConfig, fields: { ...clientConfig.fields } }

  for (const [path, sharedField] of Object.entries(sharedConfig.fields)) {
    if (!merged.fields![path]) {
      merged.fields![path] = {}
    }
    if (sharedField.validate && !merged.fields![path].validate) {
      merged.fields![path] = { ...merged.fields![path], validate: sharedField.validate }
    }
  }

  return merged
}
