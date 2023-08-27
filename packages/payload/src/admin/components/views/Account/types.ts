import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import { Fields, Data } from '../../forms/Form/types.js';
import { CollectionPermission } from '../../../../auth/types.js';

export type Props = {
  hasSavePermission: boolean
  apiURL: string
  collection: SanitizedCollectionConfig
  data: Data
  permissions: CollectionPermission
  initialState: Fields
  isLoading: boolean
  action: string
  onSave?: () => void
}
