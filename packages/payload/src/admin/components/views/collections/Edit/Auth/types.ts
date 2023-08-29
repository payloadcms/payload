import type { VerifyConfig } from '../../../../../../auth/types.js';
import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';

export type Props = {
  collection: SanitizedCollectionConfig
  email: string
  operation: 'create' | 'update'
  readOnly: boolean
  requirePassword?: boolean
  useAPIKey?: boolean
  verify?: VerifyConfig | boolean
}
