import { CollectionConfig } from '../../../../collections/config/types';
import { GlobalConfig } from '../../../../globals/config/types';
import { Permissions } from '../../../../auth/types';

export type Props = {
  collections: CollectionConfig[],
  globals: GlobalConfig[],
  permissions: Permissions
}
