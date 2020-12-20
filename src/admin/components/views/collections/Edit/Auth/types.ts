import { CollectionConfig } from '../../../../../../collections/config/types';

export type Props = {
  useAPIKey?: boolean
  requirePassword?: boolean
  verify?: boolean
  collection: CollectionConfig
  email: string
}
