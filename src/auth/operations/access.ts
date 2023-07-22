import type { PayloadRequest } from '../../express/types';
import type { Permissions } from '../types';
import type { AllOperations } from '../../types';
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit';
import { getEntityPolicies } from '../../utilities/getEntityPolicies';

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete'];

type Arguments = {
  req: PayloadRequest
}

async function accessOperation(args: Arguments): Promise<Permissions> {
  const {
    req,
    req: {
      user,
      payload: {
        config,
      },
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
      type: 'collection',
      req,
      entity: collection,
      operations: collectionOperations,
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
      type: 'global',
      req,
      entity: global,
      operations: globalOperations,
    });
    results.globals = {
      ...results.globals,
      [global.slug]: globalPolicy,
    };
  }));

  return results;
}

export default accessOperation;
