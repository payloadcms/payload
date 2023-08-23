import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { VerifyConfig } from '../../../../../../auth/types';

export type Props = {
  useAPIKey?: boolean
  requirePassword?: boolean
  verify?: VerifyConfig | boolean
  collection: SanitizedCollectionConfig
  email: string
  operation: 'update' | 'create'
  readOnly: boolean
}
