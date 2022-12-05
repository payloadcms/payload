import { tabHasName } from '../fields/config/types';
import type { CollectionConfig } from '../collections/config/types';
import type { GlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';

type Args = {
  req: PayloadRequest
  operations: string[]
  entity: CollectionConfig | GlobalConfig
}
export function getEntityPermissions<ReturnType extends GlobalPermission | CollectionPermission>(args: Args): [ReturnType, Promise<void>[]] {
  const { req, entity, operations } = args;
  const isLoggedIn = !!(req.user);

  const promises = [];
  const permissions = {} as ReturnType;

  const createAccessPromise = async ({
    mutationObj,
    access,
    operation,
    disableWhere = false,
  }) => {
    const updatedObj = mutationObj;
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

  const executeFieldPolicies = ({
    mutationObj = {},
    fields,
    operation,
  }) => {
    const updatedObj = mutationObj;

    fields.forEach(async (field) => {
      if (field.name) {
        if (!updatedObj[field.name]) updatedObj[field.name] = {};

        if (field.access && typeof field.access[operation] === 'function') {
          promises.push(createAccessPromise({
            mutationObj: updatedObj[field.name],
            access: field.access[operation],
            operation,
            disableWhere: true,
          }));
        } else {
          updatedObj[field.name][operation] = {
            permission: isLoggedIn,
          };
        }

        if (field.fields) {
          if (!updatedObj[field.name].fields) updatedObj[field.name].fields = {};
          executeFieldPolicies({
            mutationObj: updatedObj[field.name].fields,
            fields: field.fields,
            operation,
          });
        }
      } else if (field.fields) {
        executeFieldPolicies({
          mutationObj: updatedObj,
          fields: field.fields,
          operation,
        });
      } else if (field.type === 'tabs') {
        field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            if (!updatedObj[tab.name]) updatedObj[tab.name] = { fields: {} };
            executeFieldPolicies({
              mutationObj: updatedObj[tab.name].fields,
              fields: tab.fields,
              operation,
            });
          } else {
            executeFieldPolicies({
              mutationObj: updatedObj,
              fields: tab.fields,
              operation,
            });
          }
        });
      }
    });
  };

  operations.forEach((operation) => {
    executeFieldPolicies({
      mutationObj: permissions,
      fields: entity.fields,
      operation,
    });

    if (typeof entity.access[operation] === 'function') {
      promises.push(createAccessPromise({
        mutationObj: permissions,
        access: entity.access[operation],
        operation,
      }));
    } else {
      permissions[operation] = {
        permission: isLoggedIn,
      };
    }
  });

  return [permissions, promises];
}
