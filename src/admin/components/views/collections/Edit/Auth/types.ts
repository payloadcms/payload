import { CollectionConfig } from '../../../../../../collections/config/types';
import { VerifyConfig } from '../../../../../../auth/types';

export type Props = {
  useAPIKey?: boolean
  requirePassword?: boolean
  verify?: VerifyConfig
  collection: CollectionConfig
  email: string
}
