import { Field, fieldAffectsData } from '../fields/config/types';
import { PathToQuery, validOperators } from './buildQuery';
import { operatorMap } from './operatorMap';
import { getLocalizedPaths } from './getLocalizedPaths';
import { sanitizeQueryValue } from './sanitizeQueryValue';
import { PayloadRequest } from '../express/types';

type SearchParam = {
  path?: string,
  value: unknown,
}

const subQueryOptions = {
  limit: 50,
  lean: true,
};

/**
 * Convert the Payload key / value / operator into a MongoDB query
 */
export async function buildSearchParam({
  fields,
  incomingPath,
  val,
  operator,
  collectionSlug,
  globalSlug,
  req,
}: {
  fields: Field[],
  incomingPath: string,
  val: unknown,
  operator: string
  collectionSlug?: string,
  globalSlug?: string,
  req: PayloadRequest,
}): Promise<SearchParam> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath = incomingPath.replace(/__/gi, '.');
  if (sanitizedPath === 'id') sanitizedPath = '_id';

  let paths: PathToQuery[] = [];

  let hasCustomID = false;

  if (sanitizedPath === '_id') {
    const customIDfield = req.payload.collections[collectionSlug]?.config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');

    let idFieldType: 'text' | 'number' = 'text';

    if (customIDfield) {
      if (customIDfield?.type === 'text' || customIDfield?.type === 'number') {
        idFieldType = customIDfield.type;
      }

      hasCustomID = true;
    }

    paths.push({
      path: '_id',
      field: {
        name: 'id',
        type: idFieldType,
      },
      complete: true,
      collectionSlug,
    });
  } else {
    paths = await getLocalizedPaths({
      req,
      collectionSlug,
      globalSlug,
      fields,
      incomingPath: sanitizedPath,
    });
  }

  const [{
    path,
    field,
  }] = paths;

  if (path) {
    const formattedValue = sanitizeQueryValue({
      field,
      path,
      operator,
      val,
      hasCustomID,
    });

    // If there are multiple collections to search through,
    // Recursively build up a list of query constraints
    if (paths.length > 1) {
      // Remove top collection and reverse array
      // to work backwards from top
      const pathsToQuery = paths.slice(1)
        .reverse();

      const initialRelationshipQuery = {
        value: {},
      } as SearchParam;

      const relationshipQuery = await pathsToQuery.reduce(async (priorQuery, {
        path: subPath,
        collectionSlug: slug,
      }, i) => {
        const priorQueryResult = await priorQuery;

        const SubModel = req.payload.collections[slug].Model;

        // On the "deepest" collection,
        // Search on the value passed through the query
        if (i === 0) {
          const subQuery = await SubModel.buildQuery({
            where: {
              [subPath]: {
                [operator]: val,
              },
            },
            req,
          });

          const result = await SubModel.find(subQuery, subQueryOptions);

          const $in = result.map((doc) => doc._id.toString());

          if (pathsToQuery.length === 1) {
            return {
              path,
              value: { $in },
            };
          }

          const nextSubPath = pathsToQuery[i + 1].path;

          return {
            value: { [nextSubPath]: { $in } },
          };
        }

        const subQuery = priorQueryResult.value;
        const result = await SubModel.find(subQuery, subQueryOptions);

        const $in = result.map((doc) => doc._id.toString());

        // If it is the last recursion
        // then pass through the search param
        if (i + 1 === pathsToQuery.length) {
          return {
            path,
            value: { $in },
          };
        }

        return {
          value: {
            _id: { $in },
          },
        };
      }, Promise.resolve(initialRelationshipQuery));

      return relationshipQuery;
    }

    if (operator && validOperators.includes(operator)) {
      const operatorKey = operatorMap[operator];

      // Some operators like 'near' need to define a full query
      // so if there is no operator key, just return the value
      if (!operatorKey) {
        return {
          path,
          value: formattedValue,
        };
      }

      return {
        path,
        value: { [operatorKey]: formattedValue },
      };
    }
  }
  return undefined;
}
