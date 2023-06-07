import { Field, fieldAffectsData } from '../fields/config/types';
import { PayloadRequest } from '../express/types';
import { getLocalizedPaths } from '../mongoose/getLocalizedPaths';
import { EntityPolicies, PathToQuery } from '../mongoose/buildQuery';
import { getEntityPolicies } from './getEntityPolicies';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { validateQueryPaths } from './validateQueryPaths';

type Args = {
  fields: Field[]
  path: string
  val: unknown
  operator: string
  req: PayloadRequest
  errors: {path: string}[]
  policies: EntityPolicies
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  versionFields?: Field[]
  overrideAccess: boolean
}


/**
 * Validate the Payload key / value / operator
 */
export async function validateSearchParam({
  fields,
  path: incomingPath,
  versionFields,
  val,
  operator,
  collectionConfig,
  globalConfig,
  errors,
  req,
  policies,
  overrideAccess,
}: Args): Promise<void> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath;
  if (incomingPath === '_id') {
    sanitizedPath = 'id';
  } else {
    sanitizedPath = incomingPath.replace(/__/gi, '.');
  }
  let paths: PathToQuery[] = [];
  const { slug } = (collectionConfig || globalConfig);

  if (globalConfig && !policies.globals[slug]) {
    // eslint-disable-next-line no-param-reassign
    globalConfig.fields = fields;

    // eslint-disable-next-line no-param-reassign
    policies.globals[slug] = await getEntityPolicies({
      req,
      entity: globalConfig,
      operations: ['read'],
      type: 'global',
    });
  }

  if (sanitizedPath !== 'id') {
    paths = await getLocalizedPaths({
      req,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
      fields,
      incomingPath: sanitizedPath,
    });
  }

  const promises = paths.map(async ({ path, field, invalid, collectionSlug }, i) => {
    if (invalid) {
      errors.push({ path });
      return;
    }

    if (!overrideAccess && fieldAffectsData(field)) {
      if (collectionSlug) {
        if (!policies.collections[collectionSlug]) {
          // eslint-disable-next-line no-param-reassign
          policies.collections[collectionSlug] = await getEntityPolicies({
            req,
            entity: req.payload.collections[collectionSlug].config,
            operations: ['read'],
            type: 'collection',
          });
        }

        if (['salt', 'hash'].includes(incomingPath) && collectionConfig.auth && !collectionConfig.auth?.disableLocalStrategy) {
          errors.push({ path: incomingPath });
        }
      }
      let fieldAccess;
      let fieldPath = path;
      // TODO: refactor to be more understandable
      // remove locale from end of path
      if (path.endsWith(req.locale)) {
        fieldPath = path.slice(0, -(req.locale.length + 1));
      }
      if (field.type === 'relationship' && Array.isArray(field.relationTo)) {
        fieldPath = fieldPath.replace('.value', '');
      }
      if (versionFields) {
        if (fieldPath === 'parent' || fieldPath === 'version') {
          fieldAccess = true;
        } else if (globalConfig) {
          // TODO: this can probably be replaced with a function that simplifies accessing nested permissions
          fieldAccess = fieldPath.startsWith('version.') ? policies.globals[globalConfig.slug].fields.version.fields[field.name].read.permission : policies.globals[globalConfig.slug].fields[field.name].read.permission;
        } else if (collectionConfig) {
          fieldAccess = policies.collections[collectionSlug].fields[field.name].read.permission;
        }
      } else if (globalConfig) {
        fieldAccess = policies.globals[globalConfig.slug].fields[field.name].read.permission;
      } else {
        fieldAccess = policies.collections[collectionSlug].fields;
        const segments = fieldPath.split('.');
        segments.forEach((segment, pathIndex) => {
          if (pathIndex === segments.length - 1) {
            fieldAccess = fieldAccess[segment];
          } else {
            fieldAccess = fieldAccess[segment].fields;
          }
        });
        fieldAccess = fieldAccess.read.permission;
      }
      if (!fieldAccess) {
        errors.push({ path: fieldPath });
      }
    }

    if (i > 1) {
      // Remove top collection and reverse array
      // to work backwards from top
      const pathsToQuery = paths.slice(1)
        .reverse();

      pathsToQuery.forEach(({
        path: subPath,
        collectionSlug: pathCollectionSlug,
      }, pathToQueryIndex) => {
        // On the "deepest" collection,
        // validate query of the relationship
        if (pathToQueryIndex === 0) {
          validateQueryPaths({
            collectionConfig: req.payload.collections[pathCollectionSlug].config,
            globalConfig: undefined,
            where: {
              [subPath]: {
                [operator]: val,
              },
            },
            errors,
            policies,
            req,
            overrideAccess,
          });
        }
      });
    }
  });
  await Promise.all(promises);
}
