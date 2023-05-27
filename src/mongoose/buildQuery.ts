/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import deepmerge from 'deepmerge';
import { FilterQuery } from 'mongoose';
import { combineMerge } from '../utilities/combineMerge';
import { operatorMap } from './operatorMap';
import { sanitizeQueryValue } from './sanitizeQueryValue';
import { PayloadRequest, Where } from '../types';
import { Field, FieldAffectingData, fieldAffectsData, TabAsField, UIField } from '../fields/config/types';
import { CollectionPermission, FieldPermissions, GlobalPermission } from '../auth';
import QueryError from '../errors/QueryError';
import { getLocalizedPaths } from './getLocalizedPaths';

const validOperators = ['like', 'contains', 'in', 'all', 'not_in', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than', 'not_equals', 'equals', 'exists', 'near'];

const subQueryOptions = {
  limit: 50,
  lean: true,
};

export type PathToQuery = {
  complete: boolean
  collectionSlug?: string
  path: string
  field: Field | TabAsField
  fields?: (FieldAffectingData | UIField | TabAsField)[]
  fieldPolicies?: {
    [field: string]: FieldPermissions
  }
}

type SearchParam = {
  path?: string,
  value: unknown,
}

type ParamParserArgs = {
  req: PayloadRequest
  collectionSlug?: string
  globalSlug?: string
  versionsFields?: Field[]
  model: any
  where: Where
  access?: Where | boolean
  overrideAccess?: boolean
}

export class ParamParser {
  collectionSlug?: string;

  globalSlug?: string;

  overrideAccess: boolean;

  req: PayloadRequest;

  access?: Where | boolean;

  where: Where;

  model: any;

  fields: Field[];

  policies: {
    collections?: {
      [collectionSlug: string]: CollectionPermission;
    };
    globals?: {
      [globalSlug: string]: GlobalPermission;
    };
  };

  errors: { path: string }[];

  constructor({
    req,
    collectionSlug,
    globalSlug,
    versionsFields,
    model,
    where,
    access,
    overrideAccess,
  }: ParamParserArgs) {
    this.req = req;
    this.collectionSlug = collectionSlug;
    this.globalSlug = globalSlug;
    this.parse = this.parse.bind(this);
    this.model = model;
    this.where = where;
    this.access = access;
    this.overrideAccess = overrideAccess;
    this.policies = {
      collections: {},
      globals: {},
    };
    this.errors = [];

    // Get entity fields
    if (globalSlug) {
      const globalConfig = req.payload.globals.config.find(({ slug }) => slug === globalSlug);
      this.fields = versionsFields || globalConfig.fields;
    }

    if (collectionSlug) {
      const collectionConfig = req.payload.collections[collectionSlug].config;
      this.fields = versionsFields || collectionConfig.fields;
    }
  }

  // Entry point to the ParamParser class

  async parse(): Promise<Record<string, unknown>> {
    const query = await this.parsePathOrRelation(this.where, this.overrideAccess);

    const result = {
      $and: [],
    };

    if (query) result.$and.push(query);

    if (typeof this.access === 'object') {
      const accessQuery = await this.parsePathOrRelation(this.access, true);
      if (accessQuery) result.$and.push(accessQuery);
    }

    return result;
  }

  async parsePathOrRelation(object: Where, overrideAccess: boolean): Promise<Record<string, unknown>> {
    let result = {} as FilterQuery<any>;

    if (typeof object === 'object') {
      // We need to determine if the whereKey is an AND, OR, or a schema path
      for (const relationOrPath of Object.keys(object)) {
        const condition = object[relationOrPath];
        if (relationOrPath.toLowerCase() === 'and' && Array.isArray(condition)) {
          const builtAndConditions = await this.buildAndOrConditions(condition, overrideAccess);
          if (builtAndConditions.length > 0) result.$and = builtAndConditions;
        } else if (relationOrPath.toLowerCase() === 'or' && Array.isArray(condition)) {
          const builtOrConditions = await this.buildAndOrConditions(condition, overrideAccess);
          if (builtOrConditions.length > 0) result.$or = builtOrConditions;
        } else {
          // It's a path - and there can be multiple comparisons on a single path.
          // For example - title like 'test' and title not equal to 'tester'
          // So we need to loop on keys again here to handle each operator independently
          const pathOperators = object[relationOrPath];
          if (typeof pathOperators === 'object') {
            for (const operator of Object.keys(pathOperators)) {
              if (validOperators.includes(operator)) {
                const searchParam = await this.buildSearchParam({
                  fields: this.fields,
                  incomingPath: relationOrPath,
                  val: pathOperators[operator],
                  operator,
                  overrideAccess,
                });

                if (searchParam?.value && searchParam?.path) {
                  result = {
                    ...result,
                    [searchParam.path]: searchParam.value,
                  };
                } else if (typeof searchParam?.value === 'object') {
                  result = deepmerge(result, searchParam.value, { arrayMerge: combineMerge });
                }
              }
            }
          }
        }
      }
    }

    return result;
  }

  async buildAndOrConditions(conditions: Where[], overrideAccess: boolean): Promise<Record<string, unknown>[]> {
    const completedConditions = [];
    // Loop over all AND / OR operations and add them to the AND / OR query param
    // Operations should come through as an array
    for (const condition of conditions) {
      // If the operation is properly formatted as an object
      if (typeof condition === 'object') {
        const result = await this.parsePathOrRelation(condition, overrideAccess);
        if (Object.keys(result).length > 0) {
          completedConditions.push(result);
        }
      }
    }
    return completedConditions;
  }

  // Convert the Payload key / value / operator into a MongoDB query
  async buildSearchParam({
    fields,
    incomingPath,
    val,
    operator,
    overrideAccess,
  }: {
    fields: Field[],
    incomingPath: string,
    val: unknown,
    operator: string
    overrideAccess: boolean
  }): Promise<SearchParam> {
    // Replace GraphQL nested field double underscore formatting
    let sanitizedPath = incomingPath.replace(/__/gi, '.');
    if (sanitizedPath === 'id') sanitizedPath = '_id';

    let paths: PathToQuery[] = [];

    let hasCustomID = false;

    if (sanitizedPath === '_id') {
      const customIDfield = this.req.payload.collections[this.collectionSlug]?.config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');

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
        collectionSlug: this.collectionSlug,
      });
    } else {
      paths = await getLocalizedPaths({
        errors: this.errors,
        policies: this.policies,
        req: this.req,
        collectionSlug: this.collectionSlug,
        globalSlug: this.globalSlug,
        fields,
        incomingPath: sanitizedPath,
        overrideAccess,
      });
    }

    const [{ path, field }] = paths;

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
        const pathsToQuery = paths.slice(1).reverse();

        const initialRelationshipQuery = {
          value: {},
        } as SearchParam;

        const relationshipQuery = await pathsToQuery.reduce(async (priorQuery, { path: subPath, collectionSlug }, i) => {
          const priorQueryResult = await priorQuery;

          const SubModel = this.req.payload.collections[collectionSlug].Model;

          // On the "deepest" collection,
          // Search on the value passed through the query
          if (i === 0) {
            const subQuery = await SubModel.buildQuery({
              where: {
                [subPath]: {
                  [operator]: val,
                },
              },
              req: this.req,
              overrideAccess,
            });

            const result = await SubModel.find(subQuery, subQueryOptions);

            const $in = result.map((doc) => doc._id.toString());

            if (pathsToQuery.length === 1) return { path, value: { $in } };

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
            return { path, value: { $in } };
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
}

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: Field[]
}

export type BuildQueryArgs = {
  req: PayloadRequest
  where: Where
  overrideAccess: boolean
  access?: Where | boolean
  globalSlug?: string
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema) {
    const modifiedSchema = schema;
    async function buildQuery({ req, where, overrideAccess = false, access, globalSlug }: BuildQueryArgs): Promise<Record<string, unknown>> {
      const paramParser = new ParamParser({
        req,
        collectionSlug,
        globalSlug,
        versionsFields,
        model: this,
        where,
        access,
        overrideAccess,
      });
      const result = await paramParser.parse();

      if (paramParser.errors.length > 0) {
        throw new QueryError(paramParser.errors);
      }

      return result;
    }
    modifiedSchema.statics.buildQuery = buildQuery;
  };
};

export default getBuildQueryPlugin;
