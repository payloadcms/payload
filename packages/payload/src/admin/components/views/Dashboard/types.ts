import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../../../globals/config/types.js';
import { Permissions, User } from '../../../../auth/types.js';

export type Props = {
  collections: SanitizedCollectionConfig[],
  globals: SanitizedGlobalConfig[],
  permissions: Permissions,
  user: User,
}
