import { PayloadRequest } from '../../express/types';
import { Permissions } from '../types';
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit';
import { tabHasName } from '../../fields/config/types';

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

        if (field.fields) {
          if (!updatedObj[field.name].fields) updatedObj[field.name].fields = {};
          executeFieldPolicies(updatedObj[field.name].fields, field.fields, operation);
        }
      } else if (field.fields) {
        executeFieldPolicies(updatedObj, field.fields, operation);
      } else if (field.type === 'tabs') {
        field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            if (!updatedObj[tab.name]) updatedObj[tab.name] = { fields: {} };
            executeFieldPolicies(updatedObj[tab.name].fields, tab.fields, operation);
          } else {
            executeFieldPolicies(updatedObj, tab.fields, operation);
          }
        });
      }
    });
  };

  const executeEntityPolicies = async (entity, operations, type) => {
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
    results.canAccessAdmin = userCollectionConfig.access.admin ? await userCollectionConfig.access.admin(args) : isLoggedIn;
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
