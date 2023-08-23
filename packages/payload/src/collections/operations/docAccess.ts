import { AllOperations } from '../../types';
import { CollectionPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
import { getEntityPolicies } from '../../utilities/getEntityPolicies';

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
