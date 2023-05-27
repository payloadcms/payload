/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import deepmerge from 'deepmerge';
import { FilterQuery } from 'mongoose';
import { combineMerge } from '../utilities/combineMerge';
import { PayloadRequest, Where } from '../types';
import { Field, FieldAffectingData, TabAsField, UIField } from '../fields/config/types';
import { CollectionPermission, FieldPermissions, GlobalPermission } from '../auth';
import QueryError from '../errors/QueryError';
import { buildSearchParam } from './buildSearchParams';

export const validOperators = ['like', 'contains', 'in', 'all', 'not_in', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than', 'not_equals', 'equals', 'exists', 'near'];

export type EntityPolicies = {
  collections?: {
    [collectionSlug: string]: CollectionPermission;
  };
  globals?: {
    [globalSlug: string]: GlobalPermission;
  };
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
                const searchParam = await buildSearchParam({
                  collectionSlug: this.collectionSlug,
                  errors: this.errors,
                  globalSlug: this.globalSlug,
                  policies: this.policies,
                  req: this.req,
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
