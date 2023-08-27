import { AllOperations } from '../../types.js';
import { CollectionPermission } from '../../auth.js';
import type { PayloadRequest } from '../../express/types.js';
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js';

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete'];

type Arguments = {
  req: PayloadRequest
  id: string
}

export async function docAccess(args: Arguments): Promise<CollectionPermission> {
  const {
    id,
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

  return getEntityPolicies({
    type: 'collection',
    req,
    entity: config,
    operations: collectionOperations,
    id,
  });
}
