import { Field, fieldAffectsData } from '../fields/config/types';
import { PayloadRequest } from '../express/types';
import { getLocalizedPaths } from '../mongoose/getLocalizedPaths';
import { EntityPolicies, PathToQuery } from '../mongoose/buildQuery';
import { getEntityPolicies } from './getEntityPolicies';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { validateQueryPaths } from './validateQueryPaths';

type Args = {
  fields: Field[],
  path: string,
  val: unknown,
  operator: string
  req: PayloadRequest,
  errors: {path: string}[],
  policies: EntityPolicies,
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  versionFields?: Field[],
}


/**
 * Convert the Payload key / value / operator into a MongoDB query
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
}: Args): Promise<void> {
  // Replace GraphQL nested field double underscore formatting
  const sanitizedPath = incomingPath.replace(/__/gi, '.');
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

    if (fieldAffectsData(field)) {
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
      if (versionFields) {
        if (path === 'parent' || path === 'version') {
          fieldAccess = true;
        } else if (globalConfig) {
          fieldAccess = path.startsWith('version.') ? policies.globals[globalConfig.slug].fields.version.fields[field.name].read.permission : policies.globals[globalConfig.slug].fields[field.name].read.permission;
        } else if (collectionConfig) {
          fieldAccess = policies.collections[collectionSlug].fields[field.name].read.permission;
        }
      } else if (globalConfig) {
        fieldAccess = policies.globals[globalConfig.slug].fields[field.name].read.permission;
      } else {
        fieldAccess = policies.collections[collectionSlug].fields[field.name].read.permission;
      }
      if (!fieldAccess) {
        errors.push({ path });
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
          });
        }
      });
    }
  });
  await Promise.all(promises);
}
