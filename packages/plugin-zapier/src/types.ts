import type { AfterChangeHook, AfterDeleteHook } from 'payload/dist/collections/config/types'

export interface PluginConfig {
  collections: string[]
  webhookURL: string
  enabled?: Enabled
}

type Operations = 'create' | 'update' | 'delete'
type HookArgs = Parameters<AfterChangeHook>[0] | Parameters<AfterDeleteHook>[0]
type Enabled =
  | boolean
  | ((args: { operation: Operations } & Partial<HookArgs>) => boolean | Promise<boolean>)

export type Zap = (options: {
  collectionSlug: string
  operation: Operations
  data: unknown
  webhookURL: string
}) => void

export type ShouldSendZap = (args: {
  enabled?: Enabled
  hookArgs: HookArgs
  operation: Operations
}) => boolean | Promise<boolean>
