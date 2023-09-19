import type { GlobalPermission } from '../../../../auth/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { Document } from '../../../../types'
import type { Fields } from '../../forms/Form/types'

export type IndexProps = {
  global: SanitizedGlobalConfig
}

export type GlobalEditViewProps = {
  action: string
  apiURL: string
  autosaveEnabled: boolean
  data: Document
  global: SanitizedGlobalConfig
  initialState: Fields
  isLoading: boolean
  onSave: () => void
  permissions: GlobalPermission
  updatedAt: string
}
