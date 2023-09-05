/* eslint-disable no-param-reassign */
import { Field, FieldAffectingData, fieldAffectsData } from 'payload/dist/fields/config/types';
import toSnakeCase from 'to-snake-case';
import flattenFields from 'payload/dist/utilities/flattenTopLevelFields';
import { eq } from 'drizzle-orm';
import { BuildQueryJoins } from './buildQuery';
import { GenericTable, PostgresAdapter } from '../types';

type TableColumn = {
  table: GenericTable
  columnName: string
}

type Args = {
  adapter: PostgresAdapter,
  columnPrefix?: string
  fields?: Field[]
  joins: BuildQueryJoins
  path: string
  tableName: string
}
/**
 * Transforms path to table and column name
 * Adds tables to `join`
 * @returns TableColumn
 */
export const getTableColumnFromPath = ({
  adapter,
  columnPrefix = '',
  fields,
  joins,
  path: incomingPath,
  tableName,
}: Args): TableColumn => {
  const sanitizedPath = incomingPath.replace(/__/gi, '.');
  const pathSegments = sanitizedPath.split('.');

  const result: TableColumn = {
    table: adapter.tables[tableName],
    columnName: undefined,
  };

  // Goal here is to "chunk down" the path segments

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i];
    const currentPath = traversedPath.path ? `${traversedPath.path}.${segment}` : segment;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const matchedField = traversedPath.fields.find((field) => fieldAffectsData(field) && field.name === segment) as FieldAffectingData;

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
      traversedPath.columnName = `${columnPrefix || ''}${toSnakeCase(matchedField.name)}`;
      if ('hidden' in matchedField && matchedField.hidden) {
        // TODO: !overrideAccess throw error
      }

      switch (matchedField.type) {
        case 'group': {
          return getTableColumnFromPath({
            adapter,
            collectionSlug,
            path: pathSegments.slice(i + 1).join('.'),
            fields: flattenFields(matchedField.fields) as Field[],
            columnPrefix: `${columnName}_`,
            joins,
          });
        }

        // case 'blocks':
        // case 'richText':
        // case 'json': {
        //   const upcomingSegments = pathSegments.slice(i + 1)
        //     .join('.');
        //   lastIncompletePath.complete = true;
        //   lastIncompletePath.path = upcomingSegments ? `${currentPath}.${upcomingSegments}` : currentPath;
        //   return paths;
        // }

        // case 'relationship':
        // case 'upload': {
        //   // If this is a polymorphic relation,
        //   // We only support querying directly (no nested querying)
        //   if (typeof matchedField.relationTo !== 'string') {
        //     const lastSegmentIsValid = ['value', 'relationTo'].includes(pathSegments[pathSegments.length - 1]);
        //
        //     if (lastSegmentIsValid) {
        //       lastIncompletePath.complete = true;
        //       lastIncompletePath.path = pathSegments.join('.');
        //     } else {
        //       lastIncompletePath.invalid = true;
        //       return paths;
        //     }
        //   } else {
        //     lastIncompletePath.complete = true;
        //     lastIncompletePath.path = currentPath;
        //
        //     const nestedPathToQuery = pathSegments.slice(i + 1).join('.');
        //
        //     if (nestedPathToQuery) {
        //       const relatedCollection = adapter.payload.collections[matchedField.relationTo as string].config;
        //
        //       // eslint-disable-next-line no-await-in-loop
        //       const remainingPaths = traversePath({
        //         adapter,
        //         collectionSlug: relatedCollection.slug,
        //         path: nestedPathToQuery,
        //         joins,
        //       });
        //
        //       paths = [
        //         ...paths,
        //         ...remainingPaths,
        //       ];
        //     }
        //
        //     return paths;
        //   }
        //
        //   break;
        // }

        default: {
          if (matchedField.localized) {
            const joinTable = `${traversedPath.tableName}_locales`;
            joins[`${joinTable}, eq(${tableName}.id, ${joinTable}._parent_id)`] = {
              table: adapter.tables[`${traversedPath.tableName}_locales`],
              condition: eq(adapter.tables[tableName].id, adapter.tables[joinTable]._parent_id),
            };
            traversedPath.tableName = joinTable;
            traversedPath.columnName = `${traversedPath.columnPrefix || ''}${toSnakeCase(matchedField.name)}`;
          }

          traversedPath.path = currentPath;

          return traversedPath;
        }
      }
    } else {
      // TODO: throw error
    }
  }
  return traversedPath;
};
