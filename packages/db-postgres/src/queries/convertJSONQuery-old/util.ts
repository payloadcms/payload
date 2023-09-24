export const updateSpecialKeys = [
  '$currentDate',
  '$inc',
  '$min',
  '$max',
  '$mul',
  '$rename',
  '$set',
  '$setOnInsert',
  '$unset',
  '$push',
  '$pull',
  '$pullAll',
  '$addToSet',
]

export const countUpdateSpecialKeys = function (doc) {
  return Object.keys(doc).filter(function (n) {
    return updateSpecialKeys.includes(n)
  }).length
}

function quoteReplacer(key, value) {
  if (typeof value == 'string') {
    return stringEscape(value)
  }
  return value
}

export const quote = function (data) {
  if (typeof data == 'string') return "'" + stringEscape(data) + "'"
  return "'" + JSON.stringify(data) + "'::jsonb"
}

export const quote2 = function (data) {
  if (typeof data == 'string') return '\'"' + stringEscape(data) + '"\''
  return "'" + JSON.stringify(data, quoteReplacer) + "'::jsonb"
}

export const stringEscape = function (str) {
  return str.replace(/'/g, "''")
}

export const pathToText = function (path, isString) {
  let text = stringEscape(path[0])
  if (isString && path.length === 1) {
    return text + " #>>'{}'"
  }
  for (let i = 1; i < path.length; i++) {
    text += i == path.length - 1 && isString ? '->>' : '->'
    if (/^\d+$/.test(path[i])) text += path[i] //don't wrap numbers in  quotes
    else text += "'" + stringEscape(path[i]) + "'"
  }
  return text
}

export const pathToObject = function (path) {
  if (path.length === 1) {
    return quote2(path[0])
  }
  return "'" + pathToObjectHelper(path) + "'"
}

export const pathToObjectHelper = function (path) {
  if (path.length === 1) {
    if (typeof path[0] == 'string') {
      return `"${path[0]}"`
    } else {
      return JSON.stringify(path[0])
    }
  }
  const [head, ...tail] = path
  return `{ "${head}": ${pathToObjectHelper(tail)} }`
}

export const convertDotNotation = function (path, pathDotNotation) {
  return pathToText([path].concat(pathDotNotation.split('.')), true)
}

export const toPostgresPath = function (path) {
  return "'{" + path.join(',') + "}'"
}

export const toNumeric = function (path) {
  return 'COALESCE(Cast(' + path + ' as numeric),0)'
}

const typeMapping = {
  1: 'number',
  2: 'string',
  3: 'object',
  4: 'array',
  8: 'boolean',
  10: 'null',
  16: 'number',
  18: 'number',
  19: 'number',
}

export const getPostgresTypeName = function (type) {
  if (!['number', 'string'].includes(typeof type)) {
    throw { code: 14, errmsg: 'argument to $type is not a number or a string' }
  }
  return typeMapping[type] || type
}

function isIntegerStrict(val) {
  return val != 'NaN' && parseInt(val).toString() == val
}

export const getPathSortedArray = function (keys) {
  return keys.sort((a, b) => {
    if (a == b) {
      return 0
    }

    const aArr = a.split('.')
    const bArr = b.split('.')

    for (let i = 0; i < aArr.length; i++) {
      if (i >= bArr.length) {
        return -1
      }

      if (aArr[i] == bArr[i]) {
        continue
      }

      const aItem = isIntegerStrict(aArr[i]) ? parseInt(aArr[i]) : aArr[i]
      const bItem = isIntegerStrict(bArr[i]) ? parseInt(bArr[i]) : bArr[i]

      return aItem > bItem ? -1 : 1
    }

    return 1
  })
}
