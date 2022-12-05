import { NextFunction } from 'express';
import { CollectionPermission, GlobalPermission } from '../../auth';
import type { PayloadRequest } from '../../express/types';
import { getEntityPermissions } from '../../utilities/getEntityPermissions';

const allOperations = ['create', 'read', 'update', 'delete'];

type Arguments = {
  req: PayloadRequest, res: Response, next: NextFunction
}

export async function docAccess(args: Arguments): Promise<CollectionPermission | GlobalPermission> {
  const {
    req,
    req: {
      payload: {
        config,
      },
    },
  } = args;

  let results = {} as CollectionPermission | GlobalPermission;
  const promises = [];

  config.collections.forEach((collection) => {
    const collectionOperations = [...allOperations];

    // if collection.slug === collection from req do this

    if (collection.auth && (typeof collection.auth.maxLoginAttempts !== 'undefined' && collection.auth.maxLoginAttempts !== 0)) {
      collectionOperations.push('unlock');
    }

    if (collection.versions) {
      collectionOperations.push('readVersions');
    }

    const [collectionPolicy, collectionPromises] = getEntityPermissions<CollectionPermission>({
      req,
      entity: collection,
      operations: collectionOperations,
    });
    results = collectionPolicy;
    promises.push(collectionPromises);
  });

  await Promise.all(promises);

  return results;
}
