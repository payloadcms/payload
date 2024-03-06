import type { User } from '../auth/index.d.ts'
import type { PayloadRequest } from '../types/index.d.ts'

export type PreferenceRequest = {
  key: string
  overrideAccess?: boolean
  req: PayloadRequest
  user: User
}

export type PreferenceUpdateRequest = PreferenceRequest & { value: unknown }

export type CollapsedPreferences = string[]

export type TabsPreferences = Array<{
  [path: string]: number
}>

export type FieldsPreferences = {
  [key: string]: {
    collapsed: CollapsedPreferences
    tabIndex: number
  }
}

export type DocumentPreferences = {
  fields: FieldsPreferences
}
