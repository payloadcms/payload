import type { User } from '../auth'
import type { PayloadRequest } from '../express/types'

export type PreferenceRequest = {
  key: string
  overrideAccess?: boolean
  req: PayloadRequest
  user: User
}

export type PreferenceUpdateRequest = PreferenceRequest & { value: undefined }

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
