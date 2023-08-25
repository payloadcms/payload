import toSnakeCase from 'to-snake-case';
import { inArray } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';
import { getLocalizedPaths } from 'payload/database';
import { Field } from 'payload/types';
import { fieldAffectsData } from 'payload/types';
import { PathToQuery } from 'payload/database';
import { validOperators } from 'payload/types';
import { Operator } from 'payload/types';
import { operatorMap } from './operatorMap';
import { PostgresAdapter } from '../types';

type SearchParam = {
  path?: string,
  // TODO: possible better type
  //  value: SQL
  value: SQL,
}

/**
 * Convert the Payload key / value / operator into a Drizzle query
 */
export async function buildSearchParam({
  fields,
  incomingPath,
  val,
  operator,
  collectionSlug,
  globalSlug,
  adapter,
  locale,
}: {
  fields: Field[],
  incomingPath: string,
  val: unknown,
  operator: string
  collectionSlug?: string,
  globalSlug?: string,
  adapter: PostgresAdapter
  locale?: string
}): Promise<SearchParam> {
  // Replace GraphQL nested field double underscore formatting
  const sanitizedPath = incomingPath.replace(/__/gi, '.');

  let paths: PathToQuery[] = [];

  let hasCustomID = false;

  if (sanitizedPath === 'id') {
    const customIDfield = adapter.payload.collections[collectionSlug]?.config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');

    let idFieldType: 'text' | 'number' = 'text';

    if (customIDfield) {
      if (customIDfield?.type === 'text' || customIDfield?.type === 'number') {
        idFieldType = customIDfield.type;
      }

      hasCustomID = true;
    }

    paths.push({
      path: 'id',
      field: {
        name: 'id',
        type: idFieldType,
      } as Field,
      complete: true,
      collectionSlug,
    });
  } else {
    // TODO: handle differently
    paths = await getLocalizedPaths({
      payload: adapter.payload,
      locale,
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
    // TODO: determine if sanitizeQueryValue is needed or not
    const formattedValue = val;
    // const formattedValue = sanitizeQueryValue({
    //   field,
    //   path,
    //   operator,
    //   val,
    //   hasCustomID,
    // });

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
        const tableName = toSnakeCase(slug);

        // On the "deepest" collection,
        // Search on the value passed through the query
        if (i === 0) {
          // TODO: switch on field type of subPath to query the correct table for:
          // arrays
          // blocks
          // localized
          const table = adapter.tables[tableName];
          const result = await adapter.db
            .select()
            .from(table)
            .where(operatorMap[operator](table[subPath], val));

          const relatedIDs: (string | number)[] = [];

          result.forEach((row: { id: string | number, [key: string]: unknown }) => {
            relatedIDs.push(row.id);
          });

          if (pathsToQuery.length === 1) {
            return {
              path,
              value: inArray(table.id, relatedIDs),
            };
          }

          const nextSubPath = pathsToQuery[i + 1].path;
          const nextSubTableName = toSnakeCase(path);

          return {
            value: { [nextSubPath]: inArray(adapter.tables[nextSubTableName].id, relatedIDs) },
          };
        }

        const subQuery = priorQueryResult.value;
        const subQueryTable = toSnakeCase(priorQueryResult.path);

        // TODO: handle querying from adjacent tables (array, blocks, localization)
        const result = await adapter.db
          // TODO: only select id?
          .select()
          .from(subQueryTable)
          .where(subQuery as SQL);

        const relatedIDs = result.map(({ id }) => id);
        // TODO: not sure if this is tableName or subQueryTable
        const table = adapter.tables[tableName];

        // If it is the last recursion
        // then pass through the search param
        if (i + 1 === pathsToQuery.length) {
          return {
            path,
            value: inArray(subQueryTable.id, relatedIDs),
          };
        }

        return {
          value: inArray(table.id, relatedIDs),
        };
      }, Promise.resolve(initialRelationshipQuery));

      return relationshipQuery;
    }

    if (operator && validOperators.includes(operator as Operator)) {
      const operatorKey = operatorMap[operator];

      if (field.type === 'relationship' || field.type === 'upload') {
        console.log('not implemented');
        let hasNumberIDRelation;

        // const result = {
        //   value: {
        //     $or: [
        //       { [path]: { [operatorKey]: formattedValue } },
        //     ],
        //   },
        // };

        // handles custom id number type
        // if (typeof formattedValue === 'string') {
        //   if (mongoose.Types.ObjectId.isValid(formattedValue)) {
        //     result.value.$or.push({ [path]: { [operatorKey]: objectID(formattedValue) } });
        //   } else {
        //     (Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]).forEach((relationTo) => {
        //       const isRelatedToCustomNumberID = adapter.payload.collections[relationTo]?.config?.fields.find((relatedField) => {
        //         return fieldAffectsData(relatedField) && relatedField.name === 'id' && relatedField.type === 'number';
        //       });
        //
        //       if (isRelatedToCustomNumberID) {
        //         if (isRelatedToCustomNumberID.type === 'number') hasNumberIDRelation = true;
        //       }
        //     });
        //
        //     if (hasNumberIDRelation) result.value.$or.push({ [path]: { [operatorKey]: parseFloat(formattedValue) } });
        //   }
        // }

        // if (result.value.$or.length > 1) {
        //   return result;
        // }
      }

      // TODO: rewrite like or use drizzle's like operator?
      if (operator === 'like' && typeof formattedValue === 'string') {
        const words = formattedValue.split(' ');

        // const result = {
        //   value: {
        //     $and: words.map((word) => ({
        //       [path]: {
        //         $regex: word.replace(/[\\^$*+?\\.()|[\]{}]/g, '\\$&'),
        //         $options: 'i',
        //       },
        //     })),
        //   },
        // };

        // return result;
      }

      // Some operators like 'near' need to define a full query
      // so if there is no operator key, just return the value
      // if (!operatorKey) {
      //   return {
      //     path,
      //     value: formattedValue,
      //   };
      // }

      const table = adapter.tables[toSnakeCase(collectionSlug)];
      return {
        path,
        value: operatorKey(table[path], formattedValue),
      };
    }
  }
  return undefined;
}
