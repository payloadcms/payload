import { tabHasName } from '../fields/config/types';
import type { CollectionConfig } from '../collections/config/types';
import type { GlobalConfig } from '../globals/config/types';
import type { PayloadRequest } from '../express/types';
import type { CollectionPermission, GlobalPermission } from '../auth/types';

type Args = ({
  req: PayloadRequest
  operations: string[]
  id?: string
} & ({
  type: 'collection'
  entity: CollectionConfig
} | {
  type: 'global'
  entity: GlobalConfig
}))
type ReturnType<T extends Args> = T['type'] extends 'global' ? [GlobalPermission, Promise<void>[]] : [CollectionPermission, Promise<void>[]]

export function getEntityPolicies<T extends Args>(args: T): ReturnType<T> {
  const { req, entity, operations, id, type } = args;
  const isLoggedIn = !!(req.user);

  const policies = {} as ReturnType<T>[0];
  const promises = [] as ReturnType<T>[1];
  let docBeingAccessed = null;

  async function getDoc({ entityType, docSlug, docID, reqArg }) {
    if (docSlug) {
      if (entityType === 'collection' && docID) {
        const foundCollectionDoc = await reqArg.payload.findByID({
          overrideAccess: true,
          collection: docSlug,
          id,
        });
        docBeingAccessed = 'id' in foundCollectionDoc ? foundCollectionDoc : undefined;
      } else if (entityType === 'global') {
        const foundGlobalDoc = await reqArg.payload.findGlobal({
          overrideAccess: true,
          slug: docSlug,
        });
        docBeingAccessed = 'id' in foundGlobalDoc ? foundGlobalDoc : undefined;
      } else {
        docBeingAccessed = undefined;
      }
    }

    return docBeingAccessed;
  }

  const createAccessPromise = async ({
    policiesObj,
    access,
    operation,
    disableWhere = false,
  }) => {
    const mutablePolicies = policiesObj;
    // TODO: figure this out.
    // if (docBeingAccessed === null) {
    //   if (type === 'global') {
    //     try {
    //       const foundGlobalDoc = await req.payload.findGlobal({
    //         overrideAccess: true,
    //         slug: entity.slug,
    //       });
    //     } catch (e) {
    //       console.log(e);
    //     }
    //   }
    // }
    const result = await access({ req, id });

    if (typeof result === 'object' && !disableWhere) {
      mutablePolicies[operation] = {
        permission: true,
        where: result,
      };
    } else if (mutablePolicies[operation]?.permission !== false) {
      mutablePolicies[operation] = {
        permission: !!(result),
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
      policiesObj: policies,
      fields: entity.fields,
      operation,
    });

    if (typeof entity.access[operation] === 'function') {
      promises.push(createAccessPromise({
        policiesObj: policies,
        access: entity.access[operation],
        operation,
      }));
    } else {
      policies[operation] = {
        permission: isLoggedIn,
      };
    }
  });

  return [policies, promises] as ReturnType<T>;
}
