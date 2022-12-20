import { Access } from '../config/types';
import { AllOperations, Where, Document } from '../types';
import { FieldAccess, tabHasName } from '../fields/config/types';
import type { CollectionConfig } from '../collections/config/types';
import type { GlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';
import { TypeWithID } from '../collections/config/types';

type Args = ({
  req: PayloadRequest
  operations: AllOperations[]
  id?: string
} & ({
  type: 'collection'
  entity: CollectionConfig
} | {
  type: 'global'
  entity: GlobalConfig
}))
type ReturnType<T extends Args> = T['type'] extends 'global' ? [GlobalPermission, Promise<void>[]] : [CollectionPermission, Promise<void>[]]

type CreateAccessPromise = (args: {
  accessLevel: 'entity' | 'field',
  policiesObj: {
    [key: string]: any
  }
  access: Access | FieldAccess,
  operation: AllOperations,
  disableWhere?: boolean,
}) => Promise<void>

export function getEntityPolicies<T extends Args>(args: T): ReturnType<T> {
  const { req, entity, operations, id, type } = args;
  const isLoggedIn = !!(req.user);
  // ---- ---- ---- ---- ---- ---- ---- ---- ----
  // `policies` and `promises` get mutated in
  // the functions below, and return in the end
  // ---- ---- ---- ---- ---- ---- ---- ---- ----
  const policies = {
    fields: {},
  } as ReturnType<T>[0];
  const promises = [] as ReturnType<T>[1];
  let docBeingAccessed;

  async function getEntityDoc({ where }: { where?: Where } = {}): Promise<TypeWithID & Document> {
    if (entity.slug) {
      if (type === 'global') {
        return req.payload.findGlobal({
          overrideAccess: true,
          slug: entity.slug,
        });
      }

      if (type === 'collection' && id) {
        if (typeof where === 'object') {
          const paginatedRes = await req.payload.find({
            overrideAccess: true,
            collection: entity.slug,
            where: {
              ...where,
              and: [
                ...where.and || [],
                {
                  id: {
                    equals: id,
                  },
                },
              ],
            },
            limit: 1,
          });

          return paginatedRes?.docs?.[0] || undefined;
        }

        return req.payload.findByID({
          overrideAccess: true,
          collection: entity.slug,
          id,
        });
      }
    }

    return undefined;
  }

  const createAccessPromise: CreateAccessPromise = async ({
    policiesObj,
    access,
    operation,
    disableWhere = false,
    accessLevel,
  }) => {
    const mutablePolicies = policiesObj;

    if (accessLevel === 'field' && docBeingAccessed === undefined) {
      docBeingAccessed = await getEntityDoc();
    }
    const accessResult = await access({ req, id, doc: docBeingAccessed });

    if (typeof accessResult === 'object' && !disableWhere) {
      mutablePolicies[operation] = {
        permission: (id || type === 'global') ? !!(await getEntityDoc({ where: accessResult })) : true,
        where: accessResult,
      };
    } else if (mutablePolicies[operation]?.permission !== false) {
      mutablePolicies[operation] = {
        permission: !!(accessResult),
      };
    }
  };

  const executeFieldPolicies = ({
    policiesObj = {},
    fields,
    operation,
  }) => {
    const mutablePolicies = policiesObj;

    fields.forEach((field) => {
      if (field.name) {
        if (!mutablePolicies[field.name]) mutablePolicies[field.name] = {};

        if (field.access && typeof field.access[operation] === 'function') {
          promises.push(createAccessPromise({
            policiesObj: mutablePolicies[field.name],
            access: field.access[operation],
            operation,
            disableWhere: true,
            accessLevel: 'field',
          }));
        } else {
          mutablePolicies[field.name][operation] = {
            permission: isLoggedIn,
          };
        }

        if (field.fields) {
          if (!mutablePolicies[field.name].fields) mutablePolicies[field.name].fields = {};
          executeFieldPolicies({
            policiesObj: mutablePolicies[field.name].fields,
            fields: field.fields,
            operation,
          });
        }
      } else if (field.fields) {
        executeFieldPolicies({
          policiesObj: mutablePolicies,
          fields: field.fields,
          operation,
        });
      } else if (field.type === 'tabs') {
        field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            if (!mutablePolicies[tab.name]) mutablePolicies[tab.name] = { fields: {} };
            executeFieldPolicies({
              policiesObj: mutablePolicies[tab.name].fields,
              fields: tab.fields,
              operation,
            });
          } else {
            executeFieldPolicies({
              policiesObj: mutablePolicies,
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
      policiesObj: policies.fields,
      fields: entity.fields,
      operation,
    });

    if (typeof entity.access[operation] === 'function') {
      promises.push(createAccessPromise({
        policiesObj: policies,
        access: entity.access[operation],
        operation,
        accessLevel: 'entity',
      }));
    } else {
      policies[operation] = {
        permission: isLoggedIn,
      };
    }
  });

  return [policies, promises] as ReturnType<T>;
}
