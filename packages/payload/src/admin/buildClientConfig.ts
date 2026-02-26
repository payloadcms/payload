import type React from 'react'

import type { Condition, Validate } from '../fields/config/types.js'
import type { CollectionSlug, GlobalSlug, TypedSchemaPathMap } from '../index.js'

// ─── Component type helpers ───

type Comp = React.ComponentType<any> | React.ReactNode
type CompArray = (React.ComponentType<any> | React.ReactNode)[]

// ─── Per-field-type component configs ───

export type BaseFieldComponents = {
  Description?: Comp
  Error?: Comp
  Field?: Comp
  Label?: Comp
}

export type InputFieldComponents = {
  AfterInput?: Comp | CompArray
  BeforeInput?: Comp | CompArray
  Filter?: Comp
} & BaseFieldComponents

export type ArrayFieldComponents = {
  RowLabel?: Comp
} & InputFieldComponents

export type BlocksFieldComponents = BaseFieldComponents

export type BlockFieldComponents = {
  Block?: Comp
  Label?: Comp
}

export type UIFieldComponents = {
  Field?: Comp
}

// ─── Map field type string to component config ───

export type FieldComponentConfigFor<T extends string> = T extends 'array'
  ? ArrayFieldComponents
  : T extends 'blocks'
    ? BlocksFieldComponents
    : T extends 'block'
      ? BlockFieldComponents
      : T extends 'ui'
        ? UIFieldComponents
        : T extends 'entity'
          ? never
          : InputFieldComponents

// ─── Per-field-type full config ───

export type ClientFieldConfigFor<T extends string> = T extends 'entity'
  ? never
  : {
      components?: FieldComponentConfigFor<T>
      condition?: Condition
      defaultValue?: (() => unknown) | unknown
      filterOptions?: (options: any) => any
      validate?: Validate
    }

export type RscFieldConfigFor<T extends string> = T extends 'entity'
  ? never
  : {
      components?: FieldComponentConfigFor<T>
    }

// ─── Untyped fallback field configs (for string keys) ───

export type ClientFieldConfig = {
  components?: ArrayFieldComponents & BlockFieldComponents & InputFieldComponents
  condition?: Condition
  defaultValue?: (() => unknown) | unknown
  filterOptions?: (options: any) => any
  validate?: Validate
}

export type RscFieldConfig = {
  components?: ArrayFieldComponents & BlockFieldComponents & InputFieldComponents
}

// ─── Typed fields mapped type ───

type TypedClientFields<TMap extends Record<string, string>> = {
  [K in keyof TMap]?: ClientFieldConfigFor<string & TMap[K]>
}

type TypedRscFields<TMap extends Record<string, string>> = {
  [K in keyof TMap]?: RscFieldConfigFor<string & TMap[K]>
}

type TypedSharedFields<TMap extends Record<string, string>> = {
  [K in keyof TMap]?: TMap[K] extends 'entity'
    ? never
    : {
        validate?: Validate
      }
}

// ─── Admin-level config ───

type AdminViewConfig = {
  Component: React.ComponentType<any> | React.ReactNode
  exact?: boolean
  meta?: { title?: string }
  path: string
  strict?: boolean
}

export type AdminComponentsConfig = {
  actions?: CompArray
  afterDashboard?: CompArray
  afterLogin?: CompArray
  afterNav?: CompArray
  afterNavLinks?: CompArray
  avatar?: Comp
  beforeDashboard?: CompArray
  beforeLogin?: CompArray
  beforeNav?: CompArray
  beforeNavLinks?: CompArray
  graphics?: {
    Icon?: Comp
    Logo?: Comp
  }
  header?: CompArray
  logout?: {
    Button?: Comp
  }
  Nav?: Comp
  providers?: (React.ComponentType<{ children?: React.ReactNode }> | React.ReactNode)[]
  settingsMenu?: CompArray
  views?: Record<string, AdminViewConfig>
}

// ─── Collection-level config ───

export type CollectionComponentsConfig = {
  afterList?: CompArray
  afterListTable?: CompArray
  beforeList?: CompArray
  beforeListTable?: CompArray
  Description?: Comp
  edit?: {
    beforeDocumentControls?: CompArray
    editMenuItems?: CompArray
    PreviewButton?: Comp
    PublishButton?: Comp
    SaveButton?: Comp
    SaveDraftButton?: Comp
    Status?: Comp
    UnpublishButton?: Comp
    Upload?: Comp
  }
  listMenuItems?: CompArray
  views?: Record<string, any>
}

// ─── Global-level config ───

export type GlobalComponentsConfig = {
  Description?: Comp
  elements?: {
    beforeDocumentControls?: CompArray
    PreviewButton?: Comp
    PublishButton?: Comp
    SaveButton?: Comp
    SaveDraftButton?: Comp
    Status?: Comp
    UnpublishButton?: Comp
  }
  views?: Record<string, any>
}

// ─── Combined configs with type-safe keys ───

export type ClientAdminConfig<TSchemaPathMap extends Record<string, string> = TypedSchemaPathMap> =
  {
    admin?: AdminComponentsConfig
    collections?: Partial<Record<CollectionSlug, CollectionComponentsConfig>>
    fields?: TypedClientFields<TSchemaPathMap>
    globals?: Partial<Record<GlobalSlug, GlobalComponentsConfig>>
  }

export type RscAdminConfig<TSchemaPathMap extends Record<string, string> = TypedSchemaPathMap> = {
  admin?: AdminComponentsConfig
  collections?: Partial<Record<CollectionSlug, CollectionComponentsConfig>>
  fields?: TypedRscFields<TSchemaPathMap>
  globals?: Partial<Record<GlobalSlug, GlobalComponentsConfig>>
}

// ─── Shared config ───

export type SharedFieldConfig = {
  validate?: Validate
}

export type SharedAdminConfig<TSchemaPathMap extends Record<string, string> = TypedSchemaPathMap> =
  {
    fields?: TypedSharedFields<TSchemaPathMap>
  }

// ─── Backward-compatible aliases ───

export type FieldComponentConfig = ArrayFieldComponents &
  BlockFieldComponents &
  InputFieldComponents

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

// ─── Utilities ───

export function getRscSchemaPaths(rscConfig: RscAdminConfig): string[] {
  if (!rscConfig.fields) {
    return []
  }
  return Object.entries(rscConfig.fields)
    .filter(
      ([_, fieldConfig]) =>
        (fieldConfig as any)?.components && Object.keys((fieldConfig as any).components).length > 0,
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

  const merged: ClientAdminConfig = { ...clientConfig, fields: { ...clientConfig.fields } as any }

  for (const [path, sharedField] of Object.entries(sharedConfig.fields)) {
    const fields = merged.fields as Record<string, any>
    if (!fields[path]) {
      fields[path] = {}
    }
    if ((sharedField as any)?.validate && !fields[path].validate) {
      fields[path] = { ...fields[path], validate: (sharedField as any).validate }
    }
  }

  return merged
}
