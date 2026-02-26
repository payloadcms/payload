import type React from 'react'

import type { Condition, Validate } from '../fields/config/types.js'

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

export type ClientAdminConfig = Record<string, ClientFieldConfig>

export function defineClientConfig<TConfig extends ClientAdminConfig>(config: TConfig): TConfig {
  return config
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

export type RscAdminConfig = Record<string, RscFieldConfig>

export function defineRscConfig<TConfig extends RscAdminConfig>(config: TConfig): TConfig {
  return config
}

export type SharedFieldConfig = {
  validate?: Validate
}

export type SharedAdminConfig = Record<string, SharedFieldConfig>

export function defineSharedConfig<TConfig extends SharedAdminConfig>(config: TConfig): TConfig {
  return config
}

/**
 * @deprecated Use `defineClientConfig` instead.
 */
export type AdminConfig = ClientAdminConfig
/**
 * @deprecated Use `defineClientConfig` instead.
 */
export type AdminFieldConfig = ClientFieldConfig
/**
 * @deprecated Use `defineClientConfig` instead.
 */
export type AdminFieldComponentConfig = ClientFieldComponentConfig
/**
 * @deprecated Use `defineClientConfig` instead.
 */
export const buildClientConfig = defineClientConfig
