import type {
  ExportDeclaration,
  Span,
  TsInterfaceBody,
  TsInterfaceDeclaration,
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

const resolveProperty = (schema: JSONSchema4): TsType => {
  if (schema.const) {
    switch (typeof schema.const) {
      case 'boolean':
        return {
          type: 'TsLiteralType',
          literal: {
            type: 'BooleanLiteral',
            span: span(),
            value: schema.const,
          },
          span: span(),
        }
      case 'number':
        return {
          type: 'TsLiteralType',
          literal: {
            type: 'NumericLiteral',
            span: span(),
            value: schema.const,
          },
          span: span(),
        }
      case 'string':
        return {
          type: 'TsLiteralType',
          literal: {
            type: 'StringLiteral',
            span: span(),
            value: schema.const,
          },
          span: span(),
        }
    }
  }

  switch (schema.type) {
    case 'any': {
      return {
        type: 'TsKeywordType',
        kind: 'any',
        span: span(),
      }
    }
    case 'array': {
      if (!schema.items) {
        throw new Error('Array schema must have items defined')
      }

      if (Array.isArray(schema.items)) {
        throw new Error('Tuple types are not supported')
      }

      const itemsSchema = schema.items

      return {
        type: 'TsArrayType',
        elemType: resolveProperty(itemsSchema),
        span: span(),
      }
    }
    case 'boolean': {
      return {
        type: 'TsKeywordType',
        kind: 'boolean',
        span: span(),
      }
    }
    case 'integer': {
      return {
        type: 'TsKeywordType',
        kind: 'number',
        span: span(),
      }
    }
    case 'number': {
      return {
        type: 'TsKeywordType',
        kind: 'number',
        span: span(),
      }
    }
    case 'object': {
      const required = Array.isArray(schema.required) ? schema.required : []
      const properties = schema.properties || {}

      const elements: TsTypeElement[] = buildElements(required, properties)

      return {
        type: 'TsTypeLiteral',
        members: elements,
        span: span(),
      }
    }
    case 'string': {
      return {
        type: 'TsKeywordType',
        kind: 'string',
        span: span(),
      }
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
        typeAnnotation: resolveProperty(value),
      },
    })
  }

  return elements
}

export const jsonSchemaToTypescript = (schema: JSONSchema4): string => {
  if (!schema.definitions) {
    schema.definitions = {}
  }

  const interfaces: TsInterfaceDeclaration[] = []

  if (schema.title && schema.type === 'object' && schema.properties) {
    const required: string[] = Array.isArray(schema.required) ? schema.required : []

    const interfaceBody: TsInterfaceBody = {
      type: 'TsInterfaceBody',
      body: buildElements(required, schema.properties),
      span: span(),
    }

    const tsInterface: TsInterfaceDeclaration = {
      id: identifier(schema.title),
      type: 'TsInterfaceDeclaration',
      body: interfaceBody,
      declare: false,
      extends: [],
      span: span(),
    }

    interfaces.push(tsInterface)
  }

  for (const [defName, defSchema] of Object.entries(schema.definitions)) {
    if (defSchema.type === 'object' && defSchema.properties) {
      const required: string[] = Array.isArray(defSchema.required) ? defSchema.required : []

      const interfaceBody: TsInterfaceBody = {
        type: 'TsInterfaceBody',
        body: buildElements(required, defSchema.properties),
        span: span(),
      }

      const tsInterface: TsInterfaceDeclaration = {
        id: identifier(defName),
        type: 'TsInterfaceDeclaration',
        body: interfaceBody,
        declare: false,
        extends: [],
        span: span(),
      }

      interfaces.push(tsInterface)
    }
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
