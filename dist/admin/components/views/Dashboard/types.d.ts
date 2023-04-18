import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { Permissions } from '../../../../auth/types';
export type Props = {
    collections: SanitizedCollectionConfig[];
    globals: SanitizedGlobalConfig[];
    permissions: Permissions;
};
