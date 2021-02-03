import { CollectionConfig } from '../../../../../../collections/config/types';
import { VerifyConfig } from '../../../../../../auth/types';

export type Props = {
  useAPIKey?: boolean
  requirePassword?: boolean
  verify?: VerifyConfig | boolean
  collection: CollectionConfig
  email: string
  operation: 'update' | 'create'
}
