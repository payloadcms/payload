import type {
  ExportDeclaration,
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
  if (schema.oneOf) {
    const types: TsType[] = schema.oneOf.map((subSchema) => getTsType(subSchema))
    return union(types)
  }

  if (schema.anyOf) {
    const types: TsType[] = schema.anyOf.map((subSchema) => getTsType(subSchema))
    return union(types)
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
          throw new Error(`Unsupported enum value type: ${typeof enumValue}`)
      }
    })

    return union(enumTypes)
  }

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

  switch (schema.type) {
    case 'any': {
      return keyword('any')
    }
    case 'array': {
      if (!schema.items) {
        throw new Error('Array schema must have items defined')
      }

      if (Array.isArray(schema.items)) {
        throw new Error('Tuple types are not supported')
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
    case 'number': {
      return keyword('number')
    }
    case 'object': {
      const required = Array.isArray(schema.required) ? schema.required : []
      const properties = schema.properties || {}

      const elements: TsTypeElement[] = buildElements(required, properties)

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
      typeName: identifier(refType),
    }
  }

  throw new Error(`Unsupported schema type: ${JSON.stringify(schema)}`)
}

const buildElements = (
  required: string[],
  properties: Record<string, JSONSchema4>,
): TsTypeElement[] => {
  const elements: TsTypeElement[] = []

  for (const [key, value] of Object.entries(properties)) {
    elements.push({
      type: 'TsPropertySignature',
      computed: false,
      key: identifier(key),
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

  return elements
}

const buildDefinition = (name: string, schema: JSONSchema4): TsInterfaceDeclaration => {
  const required: string[] = Array.isArray(schema.required) ? schema.required : []

  const interfaceBody: TsInterfaceBody = {
    type: 'TsInterfaceBody',
    body: buildElements(required, schema.properties || {}),
    span: span(),
  }

  const tsInterface: TsInterfaceDeclaration = {
    id: identifier(name),
    type: 'TsInterfaceDeclaration',
    body: interfaceBody,
    declare: false,
    extends: [],
    span: span(),
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
    body: exports,
    interpreter: '',
    span: span(),
  })

  return result.code
}
