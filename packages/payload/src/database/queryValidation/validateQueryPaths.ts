/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Operator, PayloadRequest, Where } from '../../types.js';
import QueryError from '../../errors/QueryError.js';
import { SanitizedCollectionConfig } from '../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../globals/config/types.js';
import flattenFields from '../../utilities/flattenTopLevelFields.js';
import { Field, FieldAffectingData } from '../../fields/config/types.js';
import { validateSearchParam } from './validateSearchParams.js';
import deepCopyObject from '../../utilities/deepCopyObject.js';
import { EntityPolicies } from './types.js';
import flattenWhereToOperators from '../flattenWhereToOperators.js';
import { validOperators } from '../../types/constants.js';

type Args = {
  where: Where
  errors?: { path: string }[]
  policies?: EntityPolicies
  req: PayloadRequest
  versionFields?: Field[]
  overrideAccess: boolean
} & ({
  collectionConfig: SanitizedCollectionConfig
  globalConfig?: never | undefined
} | {
  globalConfig: SanitizedGlobalConfig
  collectionConfig?: never | undefined
})
export async function validateQueryPaths({
  where,
  collectionConfig,
  globalConfig,
  errors = [],
  policies = {
    collections: {},
    globals: {},
  },
  versionFields,
  req,
  overrideAccess,
}: Args): Promise<void> {
  const fields = flattenFields(versionFields || (globalConfig || collectionConfig).fields) as FieldAffectingData[];
  if (typeof where === 'object') {
    // const flattenedWhere = flattenWhere(where);
    const whereFields = flattenWhereToOperators(where);
    // We need to determine if the whereKey is an AND, OR, or a schema path
    const promises = [];
    whereFields.map(async (constraint) => {
      Object.keys(constraint).map(async (path) => {
        Object.entries(constraint[path]).map(async ([operator, val]) => {
          if (validOperators.includes(operator as Operator)) {
            promises.push(validateSearchParam({
              collectionConfig: deepCopyObject(collectionConfig),
              globalConfig: deepCopyObject(globalConfig),
              fields: (fields as Field[]),
              versionFields,
              errors,
              policies,
              req,
              path,
              val,
              operator,
              overrideAccess,
            }));
          }
        });
      });
    });
    await Promise.all(promises);
    if (errors.length > 0) {
      throw new QueryError(errors);
    }
  }
}
