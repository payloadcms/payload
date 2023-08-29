import { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';
import { VerifyConfig } from '../../../../../../auth/types.js';

export type Props = {
  useAPIKey?: boolean
  requirePassword?: boolean
  verify?: VerifyConfig | boolean
  collection: SanitizedCollectionConfig
  email: string
  operation: 'update' | 'create'
  readOnly: boolean
}
