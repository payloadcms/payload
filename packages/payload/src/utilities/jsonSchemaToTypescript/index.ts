import type {
  ExportDeclaration,
  Expression,
  Span,
  TsInterfaceBody,
  TsInterfaceDeclaration,
  TsKeywordTypeKind,
  TsLiteralType,
  TsType,
  TsTypeElement,
} from '@swc/core'
import type { JSONSchema4 } from 'json-schema'

import { printSync } from '@swc/core'

const span = (): Span => ({
  ctxt: 0,
  end: 0,
  start: 0,
})

const formatDefinitionName = (str: string): string => {
  // eslint-disable-next-line regexp/no-unused-capturing-group
  return str.replace(/(^\w|[_-]\w)/g, (match) => match.replace(/[_-]/, '').toUpperCase())
}

const identifier = (value: string) => ({
  type: 'Identifier' as const,
  ctxt: 0,
  optional: false,
  span: span(),
  value,
})

const booleanLiteral = (value: boolean): TsLiteralType => ({
  type: 'TsLiteralType',
  literal: {
    type: 'BooleanLiteral',
    span: span(),
    value,
  },
  span: span(),
})

const numericLiteral = (value: number): TsLiteralType => ({
  type: 'TsLiteralType',
  literal: {
    type: 'NumericLiteral',
    span: span(),
    value,
  },
  span: span(),
})

const stringLiteral = (value: string): TsLiteralType => ({
  type: 'TsLiteralType',
  literal: {
    type: 'StringLiteral',
    span: span(),
    value,
  },
  span: span(),
})

const union = (types: TsType[]): TsType => ({
  type: 'TsUnionType',
  span: span(),
  types,
})

const intersection = (types: TsType[]): TsType => ({
  type: 'TsIntersectionType',
  span: span(),
  types,
})

const keyword = (kind: TsKeywordTypeKind): TsType => ({
  type: 'TsKeywordType',
  kind,
  span: span(),
})

const object = (members: TsTypeElement[]): TsType => ({
  type: 'TsTypeLiteral',
  members,
  span: span(),
})

const array = (elemType: TsType): TsType => ({
  type: 'TsArrayType',
  elemType,
  span: span(),
})

const getTsType = (schema: JSONSchema4): TsType => {
  if (schema.const) {
    switch (typeof schema.const) {
      case 'boolean':
        return booleanLiteral(schema.const)
      case 'number':
        return numericLiteral(schema.const)
      case 'string':
        return stringLiteral(schema.const)
    }
  }

  if (Array.isArray(schema.type)) {
    const types: TsType[] = schema.type.map((type) =>
      getTsType({
        ...schema,
        type,
      }),
    )
    return union(types)
  }

  switch (schema.type) {
    case 'any': {
      return keyword('any')
    }
    case 'array': {
      if (!schema.items) {
        return array(keyword('unknown'))
      }

      if (Array.isArray(schema.items)) {
        break
      }

      const itemsSchema = schema.items

      return array(getTsType(itemsSchema))
    }
    case 'boolean': {
      return keyword('boolean')
    }
    case 'integer': {
      return keyword('number')
    }
    case 'null': {
      return keyword('null')
    }
    case 'number': {
      return keyword('number')
    }
    case 'object': {
      const required = Array.isArray(schema.required) ? schema.required : []
      const properties = schema.properties || {}

      const elements: TsTypeElement[] = buildElements(
        required,
        properties,
        schema.additionalProperties,
      )

      return object(elements)
    }

    case 'string': {
      return keyword('string')
    }
  }

  if (schema.$ref) {
    const refType = schema.$ref.split('/').pop() || 'any'

    return {
      type: 'TsTypeReference',
      span: span(),
      typeName: identifier(formatDefinitionName(refType)),
    }
  }

  if (schema.oneOf) {
    const types: TsType[] = schema.oneOf.map((subSchema) => getTsType(subSchema))
    return union(types)
  }

  if (schema.anyOf) {
    const types: TsType[] = schema.anyOf.map((subSchema) => getTsType(subSchema))
    return union(types)
  }

  if (schema.allOf) {
    const types: TsType[] = schema.allOf.map((subSchema) => getTsType(subSchema))
    return intersection(types)
  }

  if (schema.enum) {
    const enumTypes: TsType[] = schema.enum.map((enumValue) => {
      switch (typeof enumValue) {
        case 'boolean':
          return booleanLiteral(enumValue)
        case 'number':
          return numericLiteral(enumValue)
        case 'string':
          return stringLiteral(enumValue)
        default:
          break
      }
    })

    return union(enumTypes)
  }

  console.error('Unsupported schema:', JSON.stringify(schema, null, 2))

  return keyword('unknown')
}

const isIdentifierKey = (key: string): boolean => {
  return /^[A-Z_$][\w$]*$/i.test(key)
}

const getPropertyKeyType = (key: number | string): Expression => {
  if (typeof key === 'number') {
    return {
      type: 'NumericLiteral',
      span: span(),
      value: key,
    }
  }

  if (isIdentifierKey(key)) {
    return identifier(key)
  }

  return {
    type: 'StringLiteral',
    raw: `'${key}'`,
    span: span(),
    value: key,
  }
}

const buildElements = (
  required: string[],
  properties: Record<string, JSONSchema4>,
  additionalProperties: boolean | JSONSchema4 = true,
): TsTypeElement[] => {
  const elements: TsTypeElement[] = []

  for (const [key, value] of Object.entries(properties)) {
    elements.push({
      type: 'TsPropertySignature',
      computed: false,
      key: getPropertyKeyType(key),
      optional: !required.includes(key),
      readonly: false,
      span: span(),
      typeAnnotation: {
        type: 'TsTypeAnnotation',
        span: span(),
        typeAnnotation: getTsType(value),
      },
    })
  }

  if (additionalProperties) {
    elements.push({
      type: 'TsIndexSignature',

      params: [
        {
          type: 'Identifier',
          // @ts-expect-error ctxt not in swc types for some reason
          ctxt: 0,
          optional: false,
          span: span(),
          typeAnnotation: {
            type: 'TsTypeAnnotation',
            span: span(),
            typeAnnotation: keyword('string'),
          },
          value: 'key',
        },
      ],
      readonly: false,
      span: span(),
      static: false,
      typeAnnotation: {
        type: 'TsTypeAnnotation',
        span: span(),
        typeAnnotation:
          typeof additionalProperties === 'boolean'
            ? keyword('unknown')
            : getTsType(additionalProperties),
      },
    })
  }

  return elements
}

const buildDefinition = (name: string, schema: JSONSchema4): TsInterfaceDeclaration => {
  const required: string[] = Array.isArray(schema.required) ? schema.required : []

  const interfaceBody: TsInterfaceBody = {
    type: 'TsInterfaceBody',
    body: buildElements(required, schema.properties || {}, schema.additionalProperties),
    span: span(),
  }

  const tsInterface: TsInterfaceDeclaration = {
    id: identifier(formatDefinitionName(name)),
    type: 'TsInterfaceDeclaration',
    body: interfaceBody,
    declare: false,
    extends: [],
    leadingComments: [
      {
        type: 'CommentBlock',
        span: span(),
        value: schema.description
          ? `*\n * ${schema.description}\n `
          : `*\n * This interface was automatically generated from JSON Schema\n`,
      },
    ],
    span: {
      ...span(),
    },
  }

  return tsInterface
}

export const jsonSchemaToTypescript = (schema: JSONSchema4): string => {
  if (!schema.definitions) {
    schema.definitions = {}
  }

  const interfaces: TsInterfaceDeclaration[] = []

  if (schema.title && schema.type === 'object' && schema.properties) {
    interfaces.push(buildDefinition(schema.title, schema))
  }

  for (const [defName, defSchema] of Object.entries(schema.definitions)) {
    interfaces.push(buildDefinition(defName, defSchema))
  }

  const exports: ExportDeclaration[] = interfaces.map((iface) => ({
    type: 'ExportDeclaration' as const,
    declaration: iface,
    span: span(),
  }))

  const result = printSync({
    type: 'Module',
    body: [...exports],
    interpreter: '',
    span: span(),
  })

  return result.code
}
