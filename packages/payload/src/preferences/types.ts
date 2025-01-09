import type { PayloadRequest } from '../types/index.js'

export type PreferenceRequest = {
  key: string
  overrideAccess?: boolean
  req: PayloadRequest
  user: PayloadRequest['user']
}

export type PreferenceUpdateRequest = { value: unknown } & PreferenceRequest

export type CollapsedPreferences = string[]

export type TabsPreferences = Array<{
  [path: string]: number
}>

export type InsideFieldsPreferences = {
  collapsed: CollapsedPreferences
  tabIndex: number
}

export type FieldsPreferences = {
  [key: string]: InsideFieldsPreferences
}

export type DocumentPreferences = {
  fields: FieldsPreferences
}

export type ColumnPreferences = { accessor: string; active: boolean }[]

export type ListPreferences = {
  columns?: ColumnPreferences
  limit?: number
  sort?: string
}
