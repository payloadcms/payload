/* eslint-disable no-use-before-define */

export default function buildQuery(schema) {

  schema.statics.apiQuery = function (rawParams, locale, cb) {
    const model = this;
    const params = paramParser(this, rawParams, locale);
    console.log('parsed params', params);

    // Create the Mongoose Query object.
    let query = model
      .find(params.searchParams);

    console.log('after query find');

    if (params.sort)
      query = query.sort(params.sort);

    if (cb) {
      query.exec(cb);
    } else {
      return query;
    }
  };
}

function paramParser(model, rawParams, locale) {

  let query = {
    searchParams: {},
    sort: false
  };

  // Construct searchParams
  for (const key in rawParams) {
    const separatedParams = rawParams[key]
      .match(/{\w+}(.[^{}]*)/g);

    if (separatedParams === null) {
      query = parseParam(key, rawParams[key], model, query, locale);
    } else {
      for (let i = 0; i < separatedParams.length; ++i) {
        query = parseParam(key, separatedParams[i], model, query);
      }
    }
  }

  return query;
}

function convertToBoolean(str) {
  return str.toLowerCase() === 'true' ||
    str.toLowerCase() === 't' ||
    str.toLowerCase() === 'yes' ||
    str.toLowerCase() === 'y' ||
    str === '1';
}

function addSearchParam(query, key, value) {
  if (typeof query.searchParams[key] !== 'undefined') {
    for (let i in value) {
      query.searchParams[key][i] = value[i];
    }
  } else {
    query.searchParams[key] = value;
  }
  return query;
}

function parseParam(key, val, model, query, locale) {
  const lcKey = key;
  let operator = val.match(/\{(.*)\}/);
  val = val.replace(/\{(.*)\}/, '');

  if (operator) operator = operator[1];

  if (val === '') {
    return {};
  } else if (lcKey === 'sort_by' || lcKey === 'order_by') {
    const parts = val.split(',');
    query.sort = {};
    query.sort[parts[0]] = parts[1] === 'asc' || parts.length <= 1 ? 1 : parts[1];
  } else if (lcKey === 'include') {
    if (val.match(',')) {
      let orArray = [];
      val.split(',').map(id => orArray.push({ _id: id }));
      query = addSearchParam(query, '$or', orArray);
    } else
      query.searchParams['_id'] = val;
  } else if (lcKey === 'exclude') {
    if (val.match(',')) {
      let andArray = [];
      val.split(',').map(id => andArray.push({ _id: { $ne: id } }));
      query = addSearchParam(query, '$and', andArray);
    } else
      query.searchParams['_id'] = { $ne: val };
  } else if (lcKey === 'locale') {
    // Do nothing
  }
   else {
    query = parseSchemaForKey(model.schema, query, '', lcKey, val, operator, locale);
  }
  return query;
}

function parseSchemaForKey(schema, query, keyPrefix, lcKey, val, operator, locale) {
  let paramType;
  const key = keyPrefix + lcKey;

  let matches = lcKey.match(/(.+)\.(.+)/);
  if (matches) {
    // Parse SubSchema
    if (schema.paths[matches[1]].constructor.name === 'DocumentArray' ||
      schema.paths[matches[1]].constructor.name === 'Mixed') {
      parseSchemaForKey(schema.paths[matches[1]].schema, `${matches[1]}.`, matches[2], val, operator)
    } else if (schema.paths[matches[1]].constructor.name === 'SchemaType') {
      // This wasn't handled in the original package but seems to work
      paramType = schema.paths[matches[1]].schema.paths.name.instance;
    }
  } else if (typeof schema === 'object' ) {
    if (schema.obj[lcKey].intl) {
      query = addSearchParam(query, `${key}.${locale}`, val);
    }
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
    query = addSearchParam(query, key, convertToBoolean(val));
  } else if (paramType === 'Number') {
    if (val.match(/([0-9]+,?)/) && val.match(',')) {
      if (operator === 'all') {
        query = addSearchParam(query, key, { $all: val.split(',') });
      } else if (operator === 'nin') {
        query = addSearchParam(query, key, { $nin: val.split(',') });
      } else if (operator === 'mod') {
        query = addSearchParam(query, key, { $mod: [val.split(',')[0], val.split(',')[1]] });
      } else {
        query = addSearchParam(query, key, { $in: val.split(',') });
      }
    } else if (val.match(/([0-9]+)/)) {
      if (operator === 'gt' ||
        operator === 'gte' ||
        operator === 'lt' ||
        operator === 'lte' ||
        operator === 'ne') {
        let newParam = {};
        newParam['$' + operator] = val;
        query = addSearchParam(query, key, newParam);
      } else {
        query = addSearchParam(query, key, parseInt(val));
      }
    }
  } else if (paramType === 'String') {
    if (val.match(',')) {
      const options = val.split(',').map(str => new RegExp(str, 'i'));

      if (operator === 'all') {
        query = addSearchParam(query, key, { $all: options });
      } else if (operator === 'nin') {
        query = addSearchParam(query, key, { $nin: options });
      } else {
        query = addSearchParam(query, key, { $in: options });
      }
    } else if (val.match(/([0-9]+)/)) {
      if (operator === 'gt' ||
        operator === 'gte' ||
        operator === 'lt' ||
        operator === 'lte') {
        let newParam = {};
        newParam['$' + operator] = val;
        query = addSearchParam(query, key, newParam);
      } else {
        query = addSearchParam(query, key, val);
      }
    } else if (operator === 'ne' || operator === 'not') {
      const neregex = new RegExp(val, 'i');
      query = addSearchParam(query, key, { '$not': neregex });
    } else if (operator === 'like') {
      query = addSearchParam(query, key, { $regex: val, $options: '-i' });
    } else {
      query = addSearchParam(query, key, val);
    }
  } else if (paramType === 'ObjectId') {
    query = addSearchParam(query, key, val);
  } else if (paramType === 'Array') {
    query = addSearchParam(query, key, val);
  }
  return query;
}
