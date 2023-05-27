import { PayloadRequest, Where } from '../types';
import { Field, FieldAffectingData, TabAsField, UIField } from '../fields/config/types';
import { CollectionPermission, FieldPermissions, GlobalPermission } from '../auth';
import QueryError from '../errors/QueryError';
import { parsePathOrRelation } from './parsePathOrRelation';

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
    const query = await parsePathOrRelation({
      collectionSlug: this.collectionSlug,
      errors: this.errors,
      fields: this.fields,
      globalSlug: this.globalSlug,
      policies: this.policies,
      req: this.req,
      where: this.where,
      overrideAccess: this.overrideAccess,
    });

    const result = {
      $and: [],
    };

    if (query) result.$and.push(query);

    if (typeof this.access === 'object') {
      const accessQuery = await parsePathOrRelation({
        where: this.access,
        overrideAccess: true,
        collectionSlug: this.collectionSlug,
        errors: this.errors,
        fields: this.fields,
        globalSlug: this.globalSlug,
        policies: this.policies,
        req: this.req,
      });
      if (accessQuery) result.$and.push(accessQuery);
    }

    return result;
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
