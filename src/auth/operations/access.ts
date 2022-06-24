import { PayloadRequest } from '../../express/types';
import { Permissions } from '../types';
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit';

const allOperations = ['create', 'read', 'update', 'delete'];

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
  const promises = [];

  const isLoggedIn = !!(user);
  const userCollectionConfig = (user && user.collection) ? config.collections.find((collection) => collection.slug === user.collection) : null;

  const createAccessPromise = async (obj, access, operation, disableWhere = false) => {
    const updatedObj = obj;
    const result = await access({ req });

    if (typeof result === 'object' && !disableWhere) {
      updatedObj[operation] = {
        permission: true,
        where: result,
      };
    } else if (updatedObj[operation]?.permission !== false) {
      updatedObj[operation] = {
        permission: !!(result),
      };
    }
  };

  const executeFieldPolicies = (obj, fields, operation) => {
    const updatedObj = obj;

    fields.forEach(async (field) => {
      if (field.name) {
        if (!updatedObj[field.name]) updatedObj[field.name] = {};

        if (field.access && typeof field.access[operation] === 'function') {
          promises.push(createAccessPromise(updatedObj[field.name], field.access[operation], operation, true));
        } else {
          updatedObj[field.name][operation] = {
            permission: isLoggedIn,
          };
        }

        if (field.type === 'relationship') {
          const relatedCollections = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];

          relatedCollections.forEach((slug) => {
            const collection = config.collections.find((coll) => coll.slug === slug);

            if (collection && collection.access && collection.access[operation]) {
              promises.push(createAccessPromise(updatedObj[field.name], collection.access[operation], operation, true));
            }
          });
        }

        if (field.fields) {
          if (!updatedObj[field.name].fields) updatedObj[field.name].fields = {};
          executeFieldPolicies(updatedObj[field.name].fields, field.fields, operation);
        }
      } else if (field.fields) {
        executeFieldPolicies(updatedObj, field.fields, operation);
      }
    });
  };

  const executeEntityPolicies = (entity, operations, type) => {
    if (!results[type]) results[type] = {};

    results[type][entity.slug] = {
      fields: {},
    };

    operations.forEach((operation) => {
      executeFieldPolicies(results[type][entity.slug].fields, entity.fields, operation);

      if (typeof entity.access[operation] === 'function') {
        promises.push(createAccessPromise(results[type][entity.slug], entity.access[operation], operation));
      } else {
        results[type][entity.slug][operation] = {
          permission: isLoggedIn,
        };
      }
    });
  };

  if (userCollectionConfig) {
    results.canAccessAdmin = userCollectionConfig.access.admin ? userCollectionConfig.access.admin(args) : isLoggedIn;
  } else {
    results.canAccessAdmin = false;
  }

  config.collections.forEach((collection) => {
    const collectionOperations = [...allOperations];

    if (collection.auth && (typeof collection.auth.maxLoginAttempts !== 'undefined' && collection.auth.maxLoginAttempts !== 0)) {
      collectionOperations.push('unlock');
    }

    if (collection.versions) {
      collectionOperations.push('readVersions');
    }

    executeEntityPolicies(collection, collectionOperations, 'collections');
  });

  config.globals.forEach((global) => {
    const globalOperations = ['read', 'update'];

    if (global.versions) {
      globalOperations.push('readVersions');
    }
    executeEntityPolicies(global, globalOperations, 'globals');
  });

  await Promise.all(promises);

  return results;
}

export default accessOperation;
