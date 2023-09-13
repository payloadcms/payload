/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Operator, Where } from 'payload/types';
import { Field } from 'payload/dist/fields/config/types';
import { validOperators } from 'payload/dist/types/constants';
import { and, SQL } from 'drizzle-orm';
import { buildAndOrConditions } from './buildAndOrConditions';
import { GenericColumn, PostgresAdapter } from '../types';
import { operatorMap } from './operatorMap';
import { BuildQueryJoins } from './buildQuery';
import { getTableColumnFromPath } from './getTableColumnFromPath';
import { sanitizeQueryValue } from './sanitizeQueryValue';

type Args = {
  joins: BuildQueryJoins
  where: Where
  adapter: PostgresAdapter
  locale: string
  tableName: string
  fields: Field[]
  selectFields: Record<string, GenericColumn>
}

export async function parseParams({
  joins,
  where,
  adapter,
  locale,
  fields,
  tableName,
  selectFields,
}: Args): Promise<SQL> {
  let result: SQL;
  const constraints: SQL[] = [];

  if (typeof where === 'object' && Object.keys(where).length > 0) {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      if (relationOrPath) {
        const condition = where[relationOrPath];
        let conditionOperator: 'and' | 'or';
        if (relationOrPath.toLowerCase() === 'and') {
          conditionOperator = 'and';
        } else if (relationOrPath.toLowerCase() === 'or') {
          conditionOperator = 'or';
        }
        if (Array.isArray(condition)) {
          const builtConditions = await buildAndOrConditions({
            joins,
            fields,
            adapter,
            locale,
            tableName,
            where: condition,
            selectFields,
          });
          if (builtConditions.length > 0) {
            if (result) {
              result = operatorMap[conditionOperator](result, ...builtConditions);
            } else {
              result = operatorMap[conditionOperator](...builtConditions);
            }
          }
        } else {
          // It's a path - and there can be multiple comparisons on a single path.
          // For example - title like 'test' and title not equal to 'tester'
          // So we need to loop on keys again here to handle each operator independently
          const pathOperators = where[relationOrPath];
          if (typeof pathOperators === 'object') {
            for (const operator of Object.keys(pathOperators)) {
              if (validOperators.includes(operator as Operator)) {
                const {
                  field,
                  table,
                  columnName,
                  constraints: queryConstraints,
                  rawColumn,
                } = getTableColumnFromPath({
                  adapter,
                  collectionPath: relationOrPath,
                  fields,
                  joins,
                  locale,
                  pathSegments: relationOrPath.split('.'),
                  tableName,
                  selectFields,
                });

                const { operator: queryOperator, value: queryValue } = sanitizeQueryValue({
                  field,
                  operator,
                  val: where[relationOrPath][operator],
                });

                queryConstraints.forEach(({
                  table: constraintTable,
                  columnName: col,
                  value,
                }) => {
                  constraints.push(operatorMap.equals(constraintTable[col], value));
                });
                constraints.push(operatorMap[queryOperator](rawColumn || table[columnName], queryValue));
              }
            }
          }
        }
      }
    }
  }
  if (constraints.length > 0) {
    if (result) {
      result = and(result, ...constraints);
    } else {
      result = and(...constraints);
    }
  }
  if (constraints.length === 1 && !result) {
    [result] = constraints;
  }

  return result;
}
