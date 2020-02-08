const validOperators = ['like', 'in', 'all', 'nin', 'gte', 'gt', 'lte', 'lt', 'ne'];

function buildQueryPlugin(schema) {
  schema.statics.apiQuery = async function (rawParams, locale, cb) {
    const model = this;
    const paramParser = new ParamParser(this, rawParams, locale);
    const params = await paramParser.parse();

    if (cb) {
      model
        .find(params.searchParams)
        .exec(cb);
    }

    return params.searchParams;
  };
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

  async parse() {
    Object.keys(this.rawParams).forEach(async (key) => {

      // If rawParams[key] is an object, that means there are operators present.
      // Need to loop through keys on rawParams[key] to call addSearchParam on each operator found
      if (typeof this.rawParams[key] === 'object') {
        Object.keys(this.rawParams[key]).forEach(async (operator) => {
          await this.buildSearchParam(this.model.schema, key, this.rawParams[key][operator], operator);
        })
      } else {
        await this.buildSearchParam(this.model.schema, key, this.rawParams[key]);
      }
    });
    return Promise.resolve(this.query);
  }

  async buildSearchParam(schema, key, val, operator) {
    const schemaObject = schema.obj[key];
    const localizedKey = `${key}${(schemaObject && schemaObject.localized) ? `.${this.locale}` : ''}`;
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
      }
    }

    this.addSearchParam(localizedKey, formattedValue);
  }

  addSearchParam(key, value) {
    if (typeof this.query.searchParams[key] !== 'undefined') {
      Object.keys(value).forEach((i) => {
        if (value.hasOwnProperty(i)) {
          this.query.searchParams[key][i] = value[i];
        } else {
          this.query.searchParams[key] = value;
        }
      });
    } else {
      this.query.searchParams[key] = value;
    }
  }
}

module.exports = buildQueryPlugin;
