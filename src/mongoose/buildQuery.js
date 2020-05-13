/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const mongoose = require('mongoose');

const validOperators = ['like', 'in', 'all', 'not_in', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than', 'not_equals', 'equals'];

function addSearchParam(key, value, searchParams) {
  return {
    ...searchParams,
    [key]: value,
  };
}

function convertArrayFromCommaDelineated(input) {
  if (Array.isArray(input)) return input;

  if (input.indexOf(',') > -1) {
    return input.split(',');
  }

  return [input];
}

class ParamParser {
  constructor(model, rawParams, locale) {
    this.parse = this.parse.bind(this);
    this.model = model;
    this.rawParams = rawParams;
    this.locale = locale;
    this.query = {
      searchParams: {},
      sort: false,
    };
  }

  getLocalizedKey(key, schemaObject) {
    return `${key}${(schemaObject && schemaObject.localized) ? `.${this.locale}` : ''}`;
  }

  // Entry point to the ParamParser class
  async parse() {
    if (typeof this.rawParams === 'object') {
      for (const key of Object.keys(this.rawParams)) {
        if (key === 'where') {
          // We need to determine if the whereKey is an AND, OR, or a schema path
          for (const relationOrPath of Object.keys(this.rawParams.where)) {
            if (relationOrPath === 'and') {
              const andConditions = this.rawParams.where[relationOrPath];
              this.query.searchParams.$and = await this.buildAndOrConditions(andConditions);
            } else if (relationOrPath === 'or' && Array.isArray(this.rawParams.where[relationOrPath])) {
              const orConditions = this.rawParams.where[relationOrPath];
              this.query.searchParams.$or = await this.buildAndOrConditions(orConditions);
            } else {
              // It's a path - and there can be multiple comparisons on a single path.
              // For example - title like 'test' and title not equal to 'tester'
              // So we need to loop on keys again here to handle each operator independently
              const pathOperators = this.rawParams.where[relationOrPath];

              if (typeof pathOperators === 'object') {
                for (const operator of Object.keys(pathOperators)) {
                  if (validOperators.includes(operator)) {
                    const [searchParamKey, searchParamValue] = await this.buildSearchParam(this.model.schema, relationOrPath, pathOperators[operator], operator);
                    this.query.searchParams = addSearchParam(searchParamKey, searchParamValue, this.query.searchParams);
                  }
                }
              }
            }
          }
        } else if (key === 'sort') {
          this.query.sort = this.rawParams[key];
        }
      }

      return this.query;
    }

    return {};
  }

  async buildAndOrConditions(conditions) {
    const completedConditions = [];
    // Loop over all AND / OR operations and add them to the AND / OR query param
    // Operations should come through as an array
    for (const condition of conditions) {
      // If the operation is properly formatted as an object
      if (typeof condition === 'object') {
        // We will loop through each path within the condition
        for (const path of Object.keys(condition)) {
          // At this point we have an operation - i.e. title equals 'test'
          const operation = condition[path];
          if (typeof operation === 'object') {
            // Once again we need to loop through operators at this point to build the query properly
            for (const operator of Object.keys(operation)) {
              if (validOperators.includes(operator)) {
                const [searchParamKey, searchParamValue] = await this.buildSearchParam(this.model.schema, path, operation[operator], operator);
                completedConditions.push({
                  [searchParamKey]: searchParamValue,
                });
              }
            }
          }
        }
      }
    }

    return completedConditions;
  }

  // Checks to see
  async buildSearchParam(schema, key, val, operator) {
    let schemaObject = schema.obj[key];

    const sanitizedKey = key.replace(/__/gi, '.');
    let localizedKey = this.getLocalizedKey(sanitizedKey, schemaObject);


    if (key === '_id' || key === 'id') {
      localizedKey = '_id';
    }

    if (key.includes('.') || key.includes('__')) {
      const paths = key.split('.');
      schemaObject = schema.obj[paths[0]];
      const localizedPath = this.getLocalizedKey(paths[0], schemaObject);
      const path = schema.paths[localizedPath];

      // If the schema object has a dot, split on the dot
      // Check the path of the first index of the newly split array
      // If it's an array OR an ObjectID, we need to recurse

      if (path) {
        // If the path is an ObjectId with a direct ref,
        // Grab it
        let { ref } = path.options;

        // If the path is an Array, grab the ref of the first index type
        if (path.instance === 'Array') {
          ref = path.options && path.options.type && path.options.type[0].ref;
        }

        // //////////////////////////////////////////////////////////////////////////
        // TODO:
        //
        // Need to handle relationships that have more than one type.
        // Right now, this code only handles one ref. But there could be a
        // refPath as well, which could allow for a relation to multiple types.
        // In that case, we would need to get the allowed referenced models
        // and run the subModel query on each - building up a list of $in IDs.
        // //////////////////////////////////////////////////////////////////////////

        if (ref) {
          const subModel = mongoose.model(ref);
          let subQuery = {};

          const localizedSubKey = this.getLocalizedKey(paths[1], subModel.schema.obj[paths[1]]);
          const [searchParamKey, searchParamValue] = await this.buildSearchParam(subModel.schema, localizedSubKey, val, operator);
          subQuery = addSearchParam(searchParamKey, searchParamValue, subQuery, subModel.schema);

          const matchingSubDocuments = await subModel.find(subQuery);

          return [localizedPath, {
            $in: matchingSubDocuments.map(subDoc => subDoc.id),
          }];
        }
      }
    }

    let formattedValue = val;

    if (operator && validOperators.includes(operator)) {
      switch (operator) {
        case 'greater_than_equal':
          formattedValue = { $gte: val };
          break;

        case 'less_than_equal':
          formattedValue = { $lte: val };
          break;

        case 'less_than':
          formattedValue = { $lt: val };
          break;

        case 'greater_than':
          formattedValue = { $gt: val };
          break;

        case 'in':
        case 'all':
          formattedValue = { [`$${operator}`]: convertArrayFromCommaDelineated(val) };
          break;

        case 'not_in':
          formattedValue = { $nin: convertArrayFromCommaDelineated(val) };
          break;

        case 'not_equals':
          formattedValue = { $ne: val };
          break;

        case 'like':
          formattedValue = { $regex: val, $options: '-i' };
          break;

        default:
          formattedValue = val;
          break;
      }
    }

    return [localizedKey, formattedValue];
  }
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
function buildQueryPlugin(schema) {
  const modifiedSchema = schema;

  async function buildQuery(rawParams, locale) {
    const paramParser = new ParamParser(this, rawParams, locale);
    const params = await paramParser.parse();
    return params.searchParams;
  }

  modifiedSchema.statics.buildQuery = buildQuery;
}

module.exports = buildQueryPlugin;
