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

const intoTsType = (schema: JSONSchema4): TsType => {
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
    case 'string': {
      return {
        type: 'TsKeywordType',
        kind: 'string',
        span: span(),
      }
    }
  }

  throw new Error(`Unsupported schema type: ${JSON.stringify(schema)}`)
}

export const jsonSchemaToTypescript = (schema: JSONSchema4): string => {
  const interfaces: TsInterfaceDeclaration[] = []

  if (schema.type === 'object' && schema.properties) {
    const elements: TsTypeElement[] = []

    for (const [key, value] of Object.entries(schema.properties)) {
      elements.push({
        type: 'TsPropertySignature',
        computed: false,
        key: identifier(key),
        optional: false,
        readonly: false,
        span: span(),
        typeAnnotation: {
          type: 'TsTypeAnnotation',
          span: span(),
          typeAnnotation: intoTsType(value),
        },
      })
    }

    const interfaceBody: TsInterfaceBody = {
      type: 'TsInterfaceBody',
      body: elements,
      span: span(),
    }

    const tsInterface: TsInterfaceDeclaration = {
      id: identifier('Root'),
      type: 'TsInterfaceDeclaration',
      body: interfaceBody,
      declare: false,
      extends: [],
      span: span(),
    }

    interfaces.push(tsInterface)
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
