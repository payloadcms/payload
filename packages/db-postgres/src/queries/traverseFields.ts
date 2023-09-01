import type { Payload } from 'payload';
import { Field } from 'payload/dist/fields/config/types';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { BuildQueryJoins } from './buildQuery';

type PathToTraverse = {
  path: string
  complete: boolean
  field: Field
  fields: Field[]
  collectionSlug: string
  invalid: boolean
}

type Args = {
  payload: Payload
  collectionSlug: string
  path: string
  fields: Field[]
  joins: BuildQueryJoins
  setOrderBy?: boolean
}
/**
 * Traverses the fields and relationships of a given path
 * Adds tables to `join`
 * setOrderBy if enabled
 */
export const traversePath = ({
  payload,
  collectionSlug,
  path: incomingPath,
  fields,
  joins,
  setOrderBy,
}: Args): PathToTraverse[] => {
  const collection = payload.collections[collectionSlug].config;
  const pathSegments = incomingPath.split('.');
  const localizationConfig = payload.config.localization;

  let paths: PathToTraverse[] = [
    {
      path: '',
      complete: false,
      field: undefined,
      fields: (flattenFields(collection.fields, false) as Field[]),
      collectionSlug,
      invalid: false,
    },
  ];

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i];
    const lastIncompletePath = paths.find(({ complete }) => !complete);

    if (lastIncompletePath) {
      const { path } = lastIncompletePath;
      const currentPath = path ? `${path}.${segment}` : segment;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const matchedField = lastIncompletePath.fields.find((field) => fieldAffectsData(field) && field.name === segment);
      lastIncompletePath.field = matchedField;

      // if (currentPath === 'globalType' && globalSlug) {
      //   lastIncompletePath.path = currentPath;
      //   lastIncompletePath.complete = true;
      //   lastIncompletePath.field = {
      //     name: 'globalType',
      //     type: 'text',
      //   };
      //
      //   return paths;
      // }

      if (matchedField) {
        // TODO: overrideAccess
        if ('hidden' in matchedField && matchedField.hidden) {
          lastIncompletePath.invalid = true;
        }

        switch (matchedField.type) {
          case 'blocks':
          case 'richText':
          case 'json': {
            const upcomingSegments = pathSegments.slice(i + 1)
              .join('.');
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
                lastIncompletePath.invalid = true;
                return paths;
              }
            } else {
              lastIncompletePath.complete = true;
              lastIncompletePath.path = currentPath;

              const nestedPathToQuery = pathSegments.slice(i + 1).join('.');

              if (nestedPathToQuery) {
                const relatedCollection = payload.collections[matchedField.relationTo as string].config;

                // eslint-disable-next-line no-await-in-loop
                const remainingPaths = traversePath({
                  payload,
                  collectionSlug: relatedCollection.slug,
                  fields: relatedCollection.fields,
                  path: nestedPathToQuery,
                  joins,
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

            if (i + 1 === pathSegments.length) lastIncompletePath.complete = true;
            lastIncompletePath.path = currentPath;
          }
        }
      } else {
        lastIncompletePath.invalid = true;
        lastIncompletePath.path = currentPath;
        return paths;
      }
    }
  }
  return paths;
};
