import type { GlobalPermission } from '../../../../auth/types.js';
import type { SanitizedGlobalConfig } from '../../../../globals/config/types.js';
import type { Document } from '../../../../types/index.js';
import type { Fields } from '../../forms/Form/types.js';

export type IndexProps = {
  global: SanitizedGlobalConfig
}

export type Props = {
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
