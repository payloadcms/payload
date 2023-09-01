import type { PayloadRequest } from '../../express/types';
import type { AllOperations } from '../../types';
import type { Permissions } from '../types';

import { getEntityPolicies } from '../../utilities/getEntityPolicies';
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit';

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete'];

type Arguments = {
  req: PayloadRequest
}

async function accessOperation(args: Arguments): Promise<Permissions> {
  const {
    req,
    req: {
      payload: {
        config,
      },
      user,
    },
  } = args;

  adminInitTelemetry(req);

  const results = {} as Permissions;

  const isLoggedIn = !!(user);
  const userCollectionConfig = (user && user.collection) ? config.collections.find((collection) => collection.slug === user.collection) : null;

  if (userCollectionConfig) {
    results.canAccessAdmin = userCollectionConfig.access.admin ? await userCollectionConfig.access.admin(args) : isLoggedIn;
  } else {
    results.canAccessAdmin = false;
  }

  await Promise.all(config.collections.map(async (collection) => {
    const collectionOperations = [...allOperations];

    if (collection.auth && (typeof collection.auth.maxLoginAttempts !== 'undefined' && collection.auth.maxLoginAttempts !== 0)) {
      collectionOperations.push('unlock');
    }

    if (collection.versions) {
      collectionOperations.push('readVersions');
    }

    const collectionPolicy = await getEntityPolicies({
      entity: collection,
      operations: collectionOperations,
      req,
      type: 'collection',
    });
    results.collections = {
      ...results.collections,
      [collection.slug]: collectionPolicy,
    };
  }));

  await Promise.all(config.globals.map(async (global) => {
    const globalOperations: AllOperations[] = ['read', 'update'];

    if (global.versions) {
      globalOperations.push('readVersions');
    }

    const globalPolicy = await getEntityPolicies({
      entity: global,
      operations: globalOperations,
      req,
      type: 'global',
    });
    results.globals = {
      ...results.globals,
      [global.slug]: globalPolicy,
    };
  }));

  return results;
}

export default accessOperation;
