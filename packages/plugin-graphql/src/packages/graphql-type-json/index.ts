import { GraphQLScalarType } from 'graphql'
import { Kind, print } from 'graphql/language/index.js'

function identity(value) {
  return value
}

function ensureObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`JSONObject cannot represent non-object value: ${value}`)
  }

  return value
}

function parseObject(typeName, ast, variables) {
  const value = Object.create(null)
  ast.fields.forEach((field) => {
    value[field.name.value] = parseLiteral(typeName, field.value, variables)
  })

  return value
}

function parseLiteral(typeName, ast, variables) {
  switch (ast.kind) {
    case Kind.BOOLEAN:
    case Kind.STRING:
      return ast.value
    case Kind.FLOAT:
    case Kind.INT:
      return parseFloat(ast.value)
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(typeName, n, variables))
    case Kind.NULL:
      return null
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables)
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined
    default:
      throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`)
  }
}

// This named export is intended for users of CommonJS. Users of ES modules
//  should instead use the default export.
export const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description:
    'The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
  parseLiteral: (ast, variables) => parseLiteral('JSON', ast, variables),
  parseValue: identity,
  serialize: identity,
  specifiedByURL: 'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
})

export const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description:
    'The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
  parseLiteral: (ast, variables) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new TypeError(`JSONObject cannot represent non-object value: ${print(ast)}`)
    }

    return parseObject('JSONObject', ast, variables)
  },
  parseValue: ensureObject,
  serialize: ensureObject,
  specifiedByURL: 'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
})
