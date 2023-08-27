import { GlobalPermission } from '../../../../auth/types.js';
import { SanitizedGlobalConfig } from '../../../../globals/config/types.js';
import { Fields } from '../../forms/Form/types.js';
import { Document } from '../../../../types/index.js';

export type IndexProps = {
  global: SanitizedGlobalConfig
}

export type Props = {
  global: SanitizedGlobalConfig
  data: Document
  onSave: () => void
  permissions: GlobalPermission
  action: string
  apiURL: string
  initialState: Fields
  isLoading: boolean
  autosaveEnabled: boolean
  updatedAt: string
}
