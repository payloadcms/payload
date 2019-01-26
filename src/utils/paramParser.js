/* eslint-disable no-use-before-define,camelcase */
export function paramParser(model, rawParams) {
  console.log('raw params', rawParams);

  let query = {
    searchParams: {},
    page: 1,
    per_page: 100,
    sort: false
  };

  // Construct searchParams
  for (const key in rawParams) {
    const separatedParams = rawParams[key]
      .match(/{\w+}(.[^{}]*)/g);

    if (separatedParams === null) {
      query = parseParam(key, rawParams[key], model, query);
    } else {
      for (let i = 0; i < separatedParams.length; ++i) {
        query = parseParam(key, separatedParams[i], model, query);
      }
    }
  }

  console.log('query object', query);
  return query;
}

function convertToBoolean(str) {
  return str.toLowerCase() === 'true' ||
    str.toLowerCase() === 't' ||
    str.toLowerCase() === 'yes' ||
    str.toLowerCase() === 'y' ||
    str === '1';
}

function parseParam(key, val, model, query) {
  const lcKey = key;
  let operator = val.match(/\{(.*)\}/);
  val = val.replace(/\{(.*)\}/, '');

  if (operator) operator = operator[1];

  if (val === '') {
    return {};
  } else if (lcKey === 'page') {
    query.page = val;
  } else if (lcKey === 'per_page' || lcKey === 'limit') {
    query.per_page = parseInt(val);
  } else if (lcKey === 'sort_by') {
    const parts = val.split(',');
    query.sort = {};
    query.sort[parts[0]] = parts.length > 1 ? parts[1] : 1;
  } else {
    query = parseSchemaForKey(model.schema, query, '', lcKey, val, operator);
  }
  return query;
}

function parseSchemaForKey(schema, query, keyPrefix, lcKey, val, operator) {
  let paramType;
  const addSearchParam = value => {
    const key = keyPrefix + lcKey;

    if (typeof query.searchParams[key] !== 'undefined') {
      for (let i in value) {
        query.searchParams[key][i] = value[i];
      }
    } else {
      query.searchParams[key] = value;
    }
  };

  let matches = lcKey.match(/(.+)\.(.+)/);
  if (matches) {
    // parse subschema
    if (schema.paths[matches[1]].constructor.name === 'DocumentArray' ||
      schema.paths[matches[1]].constructor.name === 'Mixed') {
      parseSchemaForKey(schema.paths[matches[1]].schema, `${matches[1]}.`, matches[2], val, operator)
    }

  } else if (typeof schema === 'undefined') {
    paramType = 'String';

  } else if (typeof schema.paths[lcKey] === 'undefined') {
    // nada, not found
  } else if (operator === 'near') {
    paramType = 'Near';
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
    addSearchParam(convertToBoolean(val));
  } else if (paramType === 'Number') {
    if (val.match(/([0-9]+,?)/) && val.match(',')) {
      if (operator === 'all') {
        addSearchParam({$all: val.split(',')});
      } else if (operator === 'nin') {
        addSearchParam({$nin: val.split(',')});
      } else if (operator === 'mod') {
        addSearchParam({$mod: [val.split(',')[0], val.split(',')[1]]});
      } else {
        addSearchParam({$in: val.split(',')});
      }
    } else if (val.match(/([0-9]+)/)) {
      if (operator === 'gt' ||
        operator === 'gte' ||
        operator === 'lt' ||
        operator === 'lte' ||
        operator === 'ne') {
        let newParam = {};
        newParam['$' + operator] = val;
        addSearchParam(newParam);
      } else {
        addSearchParam(parseInt(val));
      }
    }
  } else if (paramType === 'String') {
    if (val.match(',')) {
      const options = val.split(',').map(str => new RegExp(str, 'i'));

      if (operator === 'all') {
        addSearchParam({$all: options});
      } else if (operator === 'nin') {
        addSearchParam({$nin: options});
      } else {
        addSearchParam({$in: options});
      }
    } else if (val.match(/([0-9]+)/)) {
      if (operator === 'gt' ||
        operator === 'gte' ||
        operator === 'lt' ||
        operator === 'lte') {
        let newParam = {};
        newParam['$' + operator] = val;
        addSearchParam(newParam);
      } else {
        addSearchParam(val);
      }
    } else if (operator === 'ne' || operator === 'not') {
      const neregex = new RegExp(val, 'i');
      addSearchParam({'$not': neregex});
    } else if (operator === 'like') {
      addSearchParam({$regex: val, $options: '-i'});
    } else {
      addSearchParam(val);
    }
  } else if (paramType === 'ObjectId') {
    addSearchParam(val);
  } else if (paramType === 'Array') {
    addSearchParam(val);
  }
  return query;
}
