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

type ReturnType<T extends Args> = T['type'] extends 'global' ? GlobalPermission : CollectionPermission

type CreateAccessPromise = (args: {
  accessLevel: 'entity' | 'field',
  policiesObj: {
    [key: string]: any
  }
  access: Access | FieldAccess,
  operation: AllOperations,
  disableWhere?: boolean,
}) => Promise<void>

export async function getEntityPolicies<T extends Args>(args: T): Promise<ReturnType<T>> {
  const { req, entity, operations, id, type } = args;
  const isLoggedIn = !!(req.user);
  // ---- ---- ---- ---- ---- ---- ---- ---- ----
  // `policies` and `promises` get mutated in
  // the functions below, and return in the end
  // ---- ---- ---- ---- ---- ---- ---- ---- ----
  const policies = {
    fields: {},
  } as ReturnType<T>;

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
    entityPermission,
  }) => {
    const mutablePolicies = policiesObj.fields;

    await Promise.all(fields.map(async (field) => {
      if (field.name) {
        if (!mutablePolicies[field.name]) mutablePolicies[field.name] = {};

        if (field.access && typeof field.access[operation] === 'function') {
          await createAccessPromise({
            policiesObj: mutablePolicies[field.name],
            access: field.access[operation],
            operation,
            disableWhere: true,
            accessLevel: 'field',
          });
        } else {
          mutablePolicies[field.name][operation] = {
            permission: policiesObj[operation]?.permission,
          };
        }

        if (field.fields) {
          if (!mutablePolicies[field.name].fields) mutablePolicies[field.name].fields = {};
          await executeFieldPolicies({
            policiesObj: mutablePolicies[field.name],
            fields: field.fields,
            operation,
            entityPermission,
          });
        }
      } else if (field.fields) {
        await executeFieldPolicies({
          policiesObj,
          fields: field.fields,
          operation,
          entityPermission,
        });
      } else if (field.type === 'tabs') {
        await Promise.all(field.tabs.map(async (tab) => {
          if (tabHasName(tab)) {
            if (!mutablePolicies[tab.name]) {
              mutablePolicies[tab.name] = {
                fields: {},
                [operation]: { permission: entityPermission },
              };
            }
            await executeFieldPolicies({
              policiesObj: mutablePolicies[tab.name],
              fields: tab.fields,
              operation,
              entityPermission,
            });
          } else {
            await executeFieldPolicies({
              policiesObj,
              fields: tab.fields,
              operation,
              entityPermission,
            });
          }
        }));
      }
    }));
  };

  await Promise.all(operations.map(async (operation) => {
    let entityAccessPromise: Promise<void>;

    if (typeof entity.access[operation] === 'function') {
      entityAccessPromise = createAccessPromise({
        policiesObj: policies,
        access: entity.access[operation],
        operation,
        accessLevel: 'entity',
      });
    } else {
      policies[operation] = {
        permission: isLoggedIn,
      };
    }

    await entityAccessPromise;

    await executeFieldPolicies({
      policiesObj: policies,
      fields: entity.fields,
      operation,
      entityPermission: policies[operation].permission,
    });
  }));

  return policies;
}
