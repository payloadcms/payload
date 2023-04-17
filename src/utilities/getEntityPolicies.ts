import { Access } from '../config/types';
import { AllOperations, Document, Where } from '../types';
import { FieldAccess, tabHasName } from '../fields/config/types';
import type { SanitizedCollectionConfig } from '../collections/config/types';
import { TypeWithID } from '../collections/config/types';
import type { SanitizedGlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';

type Args = {
  req: PayloadRequest
  operations: AllOperations[]
  id?: string
  type: 'collection' | 'global'
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
}

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

  const executeFieldPolicies = async ({
    policiesObj,
    fields,
    operation,
    entityAccessPromise,
  }) => {
    const mutablePolicies = policiesObj.fields;

    fields.forEach(async (field) => {
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
          if (entityAccessPromise) await entityAccessPromise;
          mutablePolicies[field.name][operation] = {
            permission: policiesObj[operation]?.permission,
          };
        }

        if (field.fields) {
          if (!mutablePolicies[field.name].fields) mutablePolicies[field.name].fields = {};
          executeFieldPolicies({
            policiesObj: mutablePolicies[field.name],
            fields: field.fields,
            operation,
            entityAccessPromise,
          });
        }
      } else if (field.fields) {
        executeFieldPolicies({
          policiesObj,
          fields: field.fields,
          operation,
          entityAccessPromise,
        });
      } else if (field.type === 'tabs') {
        field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            if (!mutablePolicies[tab.name]) mutablePolicies[tab.name] = { fields: {} };
            executeFieldPolicies({
              policiesObj: mutablePolicies[tab.name],
              fields: tab.fields,
              operation,
              entityAccessPromise,
            });
          } else {
            executeFieldPolicies({
              policiesObj,
              fields: tab.fields,
              operation,
              entityAccessPromise,
            });
          }
        });
      }
    });
  };

  operations.forEach((operation) => {
    let entityAccessPromise: Promise<void>;

    if (typeof entity.access[operation] === 'function') {
      entityAccessPromise = createAccessPromise({
        policiesObj: policies,
        access: entity.access[operation],
        operation,
        accessLevel: 'entity',
      });
      promises.push(entityAccessPromise);
    } else {
      policies[operation] = {
        permission: isLoggedIn,
      };
    }

    executeFieldPolicies({
      policiesObj: policies,
      fields: entity.fields,
      operation,
      entityAccessPromise,
    });
  });

  return [policies, promises] as ReturnType<T>;
}
