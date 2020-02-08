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
    Object.keys(this.rawParams).forEach(async (key) => {
      const separatedParams = this.rawParams[key].match(/{\w+}(.[^{}]*)/g);
      if (separatedParams === null) {
        await this.parseParam(key, this.rawParams[key]);
      } else {
        await separatedParams.forEach(separatedParam => this.parseParam(key, separatedParam));
      }
    });
    return this.query;
  }

  async parseParam(key, val) {
    await this.parseSchemaForKey(this.model.schema, key, val);
    return Promise.resolve(true);
  }

  async parseSchemaForKey(schema, key, val) {
    const schemaObject = schema.obj[key];
    const localizedKey = `${key}${(schemaObject && schemaObject.localized) ? `.${this.locale}` : ''}`;
    this.addSearchParam(localizedKey, val);
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
