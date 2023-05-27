import { Field, fieldAffectsData } from '../fields/config/types';
import flattenFields from '../utilities/flattenTopLevelFields';
import { getEntityPolicies } from '../utilities/getEntityPolicies';
import { EntityPolicies, PathToQuery } from './buildQuery';
import { PayloadRequest } from '../express/types';

export async function getLocalizedPaths({
  req,
  policies,
  collectionSlug,
  globalSlug,
  fields,
  incomingPath,
  overrideAccess,
  errors,
}: {
  req: PayloadRequest
  policies: EntityPolicies
  collectionSlug?: string
  globalSlug?: string
  fields: Field[]
  incomingPath: string
  overrideAccess: boolean
  errors: {path: string}[]
}): Promise<PathToQuery[]> {
  const pathSegments = incomingPath.split('.');
  const localizationConfig = req.payload.config.localization;

  let paths: PathToQuery[] = [
    {
      path: '',
      complete: false,
      field: undefined,
      fields: flattenFields(fields, false),
      fieldPolicies: undefined,
      collectionSlug,
    },
  ];

  if (!overrideAccess) {
    if (collectionSlug) {
      const collection = { ...req.payload.collections[collectionSlug].config };
      collection.fields = fields;

      if (!policies.collections[collectionSlug]) {
        const policy = await getEntityPolicies({
          req,
          entity: collection,
          operations: ['read'],
          type: 'collection',
        });

        // eslint-disable-next-line no-param-reassign
        policies.collections[collectionSlug] = policy;
      }

      paths[0].fieldPolicies = policies.collections[collectionSlug].fields;

      if (['salt', 'hash'].includes(incomingPath) && collection.auth && !collection.auth?.disableLocalStrategy) {
        errors.push({ path: incomingPath });
        return [];
      }
    }

    if (globalSlug) {
      if (!policies.globals[globalSlug]) {
        const global = { ...req.payload.globals.config.find(({ slug }) => slug === globalSlug) };
        global.fields = fields;

        const policy = await getEntityPolicies({
          req,
          entity: global,
          operations: ['read'],
          type: 'global',
        });

        // eslint-disable-next-line no-param-reassign
        policies.globals[globalSlug] = policy;
      }

      paths[0].fieldPolicies = policies.globals[globalSlug].fields;
    }
  }

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i];

    const lastIncompletePath = paths.find(({ complete }) => !complete);

    if (lastIncompletePath) {
      const { path } = lastIncompletePath;
      let currentPath = path ? `${path}.${segment}` : segment;

      const matchedField = lastIncompletePath.fields.find((field) => fieldAffectsData(field) && field.name === segment);
      lastIncompletePath.field = matchedField;

      if (currentPath === 'globalType' && globalSlug) {
        lastIncompletePath.path = currentPath;
        lastIncompletePath.complete = true;
        lastIncompletePath.field = {
          name: 'globalType',
          type: 'text',
        };

        return paths;
      }

      if (matchedField) {
        if (!overrideAccess) {
          const fieldAccess = lastIncompletePath.fieldPolicies[matchedField.name].read.permission;

          if (!fieldAccess || ('hidden' in matchedField && matchedField.hidden)) {
            errors.push({ path: currentPath });
            return paths;
          }
        }

        const nextSegment = pathSegments[i + 1];
        const nextSegmentIsLocale = localizationConfig && localizationConfig.locales.includes(nextSegment);

        if (nextSegmentIsLocale) {
        // Skip the next iteration, because it's a locale
          i += 1;
          currentPath = `${currentPath}.${nextSegment}`;
        } else if (localizationConfig && 'localized' in matchedField && matchedField.localized) {
          currentPath = `${currentPath}.${req.locale}`;
        }

        switch (matchedField.type) {
          case 'blocks':
          case 'richText':
          case 'json': {
            const upcomingSegments = pathSegments.slice(i + 1).join('.');
            lastIncompletePath.complete = true;
            lastIncompletePath.path = upcomingSegments ? `${currentPath}.${upcomingSegments}` : currentPath;
            return paths;
          }

          case 'relationship':
          case 'upload': {
          // If this is a polymorphic relation,
          // We only support querying directly (no nested querying)
            if (typeof matchedField.relationTo !== 'string') {
              const lastSegmentIsValid = ['value', 'relationTo'].includes(pathSegments[pathSegments.length - 1]);

              if (lastSegmentIsValid) {
                lastIncompletePath.complete = true;
                lastIncompletePath.path = pathSegments.join('.');
              } else {
                errors.push({ path: currentPath });
                return paths;
              }
            } else {
              lastIncompletePath.complete = true;
              lastIncompletePath.path = currentPath;

              const nestedPathToQuery = pathSegments.slice(nextSegmentIsLocale ? i + 2 : i + 1).join('.');

              if (nestedPathToQuery) {
                const relatedCollection = req.payload.collections[matchedField.relationTo as string].config;

                // eslint-disable-next-line no-await-in-loop
                const remainingPaths = await getLocalizedPaths({
                  errors,
                  req,
                  policies,
                  globalSlug,
                  collectionSlug: relatedCollection.slug,
                  fields: relatedCollection.fields,
                  incomingPath: nestedPathToQuery,
                  overrideAccess,
                });

                paths = [
                  ...paths,
                  ...remainingPaths,
                ];
              }

              return paths;
            }

            break;
          }

          default: {
            if ('fields' in lastIncompletePath.field) {
              lastIncompletePath.fields = flattenFields(lastIncompletePath.field.fields, false);
            }

            if (!overrideAccess && 'fields' in lastIncompletePath.fieldPolicies[lastIncompletePath.field.name]) {
              lastIncompletePath.fieldPolicies = lastIncompletePath.fieldPolicies[lastIncompletePath.field.name].fields;
            }

            if (i + 1 === pathSegments.length) lastIncompletePath.complete = true;
            lastIncompletePath.path = currentPath;
          }
        }
      } else {
        errors.push({ path: currentPath });
        return paths;
      }
    }
  }

  return paths;
}
