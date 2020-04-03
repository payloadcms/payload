const mongoose = require('mongoose');

const validOperators = ['like', 'in', 'all', 'nin', 'gte', 'gt', 'lte', 'lt', 'ne'];

function addSearchParam(key, value, searchParams, schema) {
  if (schema.paths[key]) {
    if (typeof value === 'object') {
      return {
        ...searchParams,
        [key]: {
          ...searchParams[key],
          ...value,
        },
      };
    }

    return {
      ...searchParams,
      [key]: value,
    };
  }

  return searchParams;
}

class ParamParser {
  constructor(model, rawParams, locale) {
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
    Object.keys(this.rawParams).forEach(async (key) => {
      // If rawParams[key] is an object, that means there are operators present.
      // Need to loop through keys on rawParams[key] to call addSearchParam on each operator found
      if (typeof this.rawParams[key] === 'object') {
        Object.keys(this.rawParams[key])
          .forEach(async (operator) => {
            const [searchParamKey, searchParamValue] = await this.buildSearchParam(this.model.schema, key, this.rawParams[key][operator], operator);
            this.query.searchParams = addSearchParam(searchParamKey, searchParamValue, this.query.searchParams, this.model.schema);
          });
        // Otherwise there are no operators present
      } else {
        const [searchParamKey, searchParamValue] = await this.buildSearchParam(this.model.schema, key, this.rawParams[key]);
        if (searchParamKey === 'sort') {
          this.query.sort = searchParamValue;
        } else {
          this.query.searchParams = addSearchParam(searchParamKey, searchParamValue, this.query.searchParams, this.model.schema);
        }
      }
    });

    return this.query;
  }

  async buildSearchParam(schema, key, val, operator) {
    let schemaObject = schema.obj[key];
    const localizedKey = this.getLocalizedKey(key, schemaObject);

    if (key.includes('.')) {
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

        if (ref) {
          const subModel = mongoose.model(ref);
          let subQuery = {};

          const localizedSubKey = this.getLocalizedKey(paths[1], subModel.schema.obj[paths[1]]);

          if (typeof val === 'object') {
            Object.keys(val).forEach(async (subOperator) => {
              const [searchParamKey, searchParamValue] = await this.buildSearchParam(subModel.schema, localizedSubKey, val[subOperator], subOperator);
              subQuery = addSearchParam(searchParamKey, searchParamValue, subQuery, subModel.schema);
            });
          } else {
            const [searchParamKey, searchParamValue] = await this.buildSearchParam(subModel.schema, localizedSubKey, val);
            subQuery = addSearchParam(searchParamKey, searchParamValue, subQuery, subModel.schema);
          }

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
        case 'gte':
        case 'lte':
        case 'lt':
        case 'gt':
          formattedValue = {
            [`$${operator}`]: val,
          };

          break;

        case 'in':
        case 'all':
        case 'nin':
          formattedValue = {
            [`$${operator}`]: val.split(','),
          };

          break;

        default:
          formattedValue = {
            $regex: val,
            $options: '-i',
          };

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
  modifiedSchema.statics.apiQuery = async (rawParams, locale) => {
    const paramParser = new ParamParser(this, rawParams, locale);
    const params = await paramParser.parse();
    return params.searchParams;
  };
}

module.exports = buildQueryPlugin;
