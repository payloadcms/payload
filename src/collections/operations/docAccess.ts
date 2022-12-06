import { CollectionPermission, GlobalPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
import { getEntityPermissions } from '../../utilities/getEntityPermissions';

const allOperations = ['create', 'read', 'update', 'delete'];

type Arguments = {
  req: PayloadRequest
}

export async function docAccess(args: Arguments): Promise<CollectionPermission | GlobalPermission> {
  const {
    req,
    req: {
      collection: {
        config,
      },
    },
  } = args;

  const collectionOperations = [...allOperations];

  if (config.auth && (typeof config.auth.maxLoginAttempts !== 'undefined' && config.auth.maxLoginAttempts !== 0)) {
    collectionOperations.push('unlock');
  }

  if (config.versions) {
    collectionOperations.push('readVersions');
  }

  const [collectionPolicy, promises] = getEntityPermissions<CollectionPermission>({
    req,
    entity: config,
    operations: collectionOperations,
  });

  await Promise.all(promises);

  return collectionPolicy;
}
