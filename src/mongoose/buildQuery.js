const mongoose = require('mongoose');

/* eslint-disable no-use-before-define */

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
    // Construct searchParams
    // let keys = Object.keys(this.rawParams);
    Object.keys(this.rawParams).forEach(async (key) => {
      const separatedParams = this.rawParams[key].match(/{\w+}(.[^{}]*)/g);

      if (separatedParams === null) {
        await this.parseParam(key, this.rawParams[key], this.model, this.locale);
      } else {
        for (let i = 0; i < separatedParams.length; ++i) {
          await this.parseParam(key, separatedParams[i], this.model, this.locale);
        }
      }
    });
    return this.query;
  }

  async parseParam(key, val, model, locale) {
    const lcKey = key;
    let operator = val.match(/\{(.*)\}/);
    val = val.replace(/\{(.*)\}/, '');

    if (operator) operator = operator[1];

    if (val === '') {
      return {};
    } if (lcKey === 'sort_by' || lcKey === 'order_by') {
      const parts = val.split(',');
      this.query.sort = {};
      this.query.sort[parts[0]] = parts[1] === 'asc' || parts.length <= 1 ? 1 : parts[1];
    } else if (lcKey === 'include') {
      if (val.match(',')) {
        const orArray = [];
        val.split(',').map(id => orArray.push({ _id: id }));
        this.addSearchParam('$or', orArray);
      } else {
        this.query.searchParams['_id'] = val;
      }
    } else if (lcKey === 'exclude') {
      if (val.match(',')) {
        const andArray = [];
        val.split(',').map(id => andArray.push({ _id: { $ne: id } }));
        this.addSearchParam('$and', andArray);
      } else {
        this.query.searchParams['_id'] = { $ne: val };
      }
    } else if (lcKey === 'locale') {
      // Do nothing
    } else {
      await this.parseSchemaForKey(model.schema, '', lcKey, val, operator, locale);
    }
    return Promise.resolve(true);
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
    }
  }

  async parseSchemaForKey(schema, keyPrefix, lcKey, val, operator, locale) {
    let paramType;
    let key = keyPrefix + lcKey;

    const split = lcKey.split('.');
    console.log('lcKey', lcKey);
    if (split.length > 1) {
      // Parse SubSchema
      if (schema.paths[split[0]].constructor.name === 'DocumentArray'
        || schema.paths[split[0]].constructor.name === 'Mixed') {
        await this.parseSchemaForKey(schema.paths[split[0]].schema, `${split[0]}.`, split[1], val, operator);
      } else if (schema.paths[split[0]].constructor.name === 'SchemaType') {
        // This wasn't handled in the original package but seems to work
        paramType = schema.paths[split[0]].schema.paths.name.instance;
      } else if (schema.paths[split[0]].constructor.name === 'SchemaArray') {
        paramType = 'Array';
      }
    } else if (schema.obj[lcKey] && typeof schema === 'object') {
      if (schema.obj[lcKey].intl) {
        key = `${key}.${locale}`;
      }
      paramType = schema.obj[lcKey].name || schema.obj[lcKey].type.name;
    } else if (typeof schema === 'undefined') {
      paramType = 'String';
    } else if (typeof schema.paths[lcKey] === 'undefined') {
      // nada, not found
    } else if (schema.paths[lcKey].constructor.name === 'SchemaBoolean') {
      paramType = 'Boolean';
    } else if (schema.paths[lcKey].constructor.name === 'SchemaString') {
      paramType = 'String';
    } else if (schema.paths[lcKey].constructor.name === 'SchemaNumber') {
      paramType = 'Number';
    } else if (schema.paths[lcKey].constructor.name === 'ObjectId') {
      paramType = 'ObjectId';
    } else if (schema.paths[lcKey].constructor.name === 'SchemaArray') {
      paramType = 'Array';
    }

    if (paramType === 'Boolean') {
      const convertToBoolean = (str) => {
        return str.toLowerCase() === 'true'
          || str.toLowerCase() === 't'
          || str.toLowerCase() === 'yes'
          || str.toLowerCase() === 'y'
          || str === '1';
      };
      this.addSearchParam(key, convertToBoolean(val));
    } else if (paramType === 'Number') {
      if (val.match(/([0-9]+,?)/) && val.match(',')) {
        if (operator === 'all') {
          this.addSearchParam(key, { $all: val.split(',') });
        } else if (operator === 'nin') {
          this.addSearchParam(key, { $nin: val.split(',') });
        } else if (operator === 'mod') {
          this.addSearchParam(key, { $mod: [val.split(',')[0], val.split(',')[1]] });
        } else {
          this.addSearchParam(key, { $in: val.split(',') });
        }
      } else if (val.match(/([0-9]+)/)) {
        if (operator === 'gt'
          || operator === 'gte'
          || operator === 'lt'
          || operator === 'lte'
          || operator === 'ne') {
          const newParam = {};
          newParam[`$${ operator}`] = val;
          this.addSearchParam(key, newParam);
        } else {
          this.addSearchParam(key, parseInt(val));
        }
      }
    } else if (paramType === 'String') {
      if (val.match(',')) {
        const options = val.split(',').map(str => new RegExp(str, 'i'));

        if (operator === 'all') {
          this.addSearchParam(key, { $all: options });
        } else if (operator === 'nin') {
          this.addSearchParam(key, { $nin: options });
        } else {
          this.addSearchParam(key, { $in: options });
        }
      } else if (val.match(/([0-9]+)/)) {
        if (operator === 'gt'
          || operator === 'gte'
          || operator === 'lt'
          || operator === 'lte') {
          const newParam = {};
          newParam[`$${operator}`] = val;
          this.addSearchParam(key, newParam);
        } else {
          this.addSearchParam(key, val);
        }
      } else if (operator === 'ne' || operator === 'not') {
        const neregex = new RegExp(val, 'i');
        this.addSearchParam(key, { $not: neregex });
      } else if (operator === 'like') {
        this.addSearchParam(key, { $regex: val, $options: '-i' });
      } else {
        this.addSearchParam(key, val);
      }
    } else if (paramType === 'ObjectId') {
      this.addSearchParam(key, val);
    } else if (paramType === 'Array') {

      const recurseSchema = async (count, tempSchema) => {
        const path = tempSchema.paths[split[count]];
        const ref = path && path.options && path.options.type && path.options.type[0].ref;
        console.log('ref', ref);
        let refKey = split[count + 1];

        if (ref && refKey) {
          const refModel = mongoose.model(ref);

          if (count < split.length - 1) {
            count++;
            await recurseSchema(count, refModel.schema);
          }

          if (refKey && refModel.schema.obj[refKey].intl) {
            refKey = `${refKey}.${locale}`;
          }

          console.log('refKey', refKey, count);

          // TODO: Need to recursively traverse paths longer than two segments.
          // Example: this code handles "categories.title" but will not handle "categories.pages.title".

          // TODO: Support operators as above
          const refQuery = await refModel.find({ [refKey]: val });
          if (refQuery) {
            this.query.searchParams[split[count]] = { $in: refQuery.map(doc => doc.id) };
          }
        } else if (!ref) {
          this.addSearchParam(key, val);
        }
      };

      await recurseSchema(0, schema);
    }
    console.log('this.query', JSON.stringify(this.query));
  }
}

module.exports = buildQueryPlugin;
