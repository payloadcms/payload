import { GlobalPermission } from '../../../../auth/types';
import { GlobalConfig } from '../../../../globals/config/types';
import { Fields } from '../../forms/Form/types';

export type IndexProps = {
  global: GlobalConfig
}

export type Props = {
  global: GlobalConfig
  data: Record<string, unknown>
  onSave: () => void
  permissions: GlobalPermission
  action: string
  apiURL: string
  initialState: Fields
}
