import type { JSONSchema4 } from 'json-schema'

import * as ts from 'typescript'

const formatDefinitionName = (str: string): string => {
  // eslint-disable-next-line regexp/no-unused-capturing-group
  return str.replace(/(^\w|[_-]\w)/g, (match) => match.replace(/[_-]/, '').toUpperCase())
}

const getTsType = (schema: JSONSchema4): ts.TypeNode => {
  if (schema.const) {
    switch (typeof schema.const) {
      case 'boolean':
        return ts.factory.createLiteralTypeNode(
          schema.const ? ts.factory.createTrue() : ts.factory.createFalse(),
        )
      case 'number':
        return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(schema.const))
      case 'string':
        return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(schema.const))
    }
  }

  if (Array.isArray(schema.type)) {
    const types: ts.TypeNode[] = schema.type.map((type) =>
      getTsType({
        ...schema,
        type,
      }),
    )
    return ts.factory.createUnionTypeNode(types)
  }

  switch (schema.type) {
    case 'any': {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    }
    case 'array': {
      if (!schema.items) {
        return ts.factory.createArrayTypeNode(
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
        )
      }

      if (Array.isArray(schema.items)) {
        break
      }

      const itemsSchema = schema.items

      return ts.factory.createArrayTypeNode(getTsType(itemsSchema))
    }
    case 'boolean': {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
    }
    case 'integer': {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
    }
    case 'null': {
      return ts.factory.createLiteralTypeNode(ts.factory.createNull())
    }
    case 'number': {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
    }
    case 'object': {
      const required = Array.isArray(schema.required) ? schema.required : []
      const properties = schema.properties || {}

      const members = buildMembers(required, properties, schema.additionalProperties)

      return ts.factory.createTypeLiteralNode(members)
    }

    case 'string': {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
    }
  }

  if (schema.$ref) {
    const refType = schema.$ref.split('/').pop() || 'any'

    return ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier(formatDefinitionName(refType)),
    )
  }

  if (schema.oneOf) {
    let hasNull = false
    const filteredSchemas = schema.oneOf.filter((subSchema) => {
      if (subSchema.type === 'null') {
        hasNull = true
        return false
      }
      return true
    })

    const types: ts.TypeNode[] = filteredSchemas.map((subSchema) => getTsType(subSchema))

    if (hasNull) {
      types.push(ts.factory.createLiteralTypeNode(ts.factory.createNull()))
    }

    return ts.factory.createUnionTypeNode(types)
  }

  if (schema.anyOf) {
    const types: ts.TypeNode[] = schema.anyOf.map((subSchema) => getTsType(subSchema))
    return ts.factory.createUnionTypeNode(types)
  }

  if (schema.allOf) {
    const types: ts.TypeNode[] = schema.allOf.map((subSchema) => getTsType(subSchema))
    return ts.factory.createIntersectionTypeNode(types)
  }

  if (schema.enum) {
    // @ts-expect-error
    const enumTypes: ts.TypeNode[] = schema.enum.map((enumValue) => {
      switch (typeof enumValue) {
        case 'boolean':
          return ts.factory.createLiteralTypeNode(
            enumValue ? ts.factory.createTrue() : ts.factory.createFalse(),
          )
        case 'number':
          return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(enumValue))
        case 'string':
          return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(enumValue))
        default:
          break
      }
    })

    return ts.factory.createUnionTypeNode(enumTypes)
  }

  console.error('Unsupported schema:', JSON.stringify(schema, null, 2))

  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
}

const isIdentifierKey = (key: string): boolean => {
  return /^[A-Z_$][\w$]*$/i.test(key)
}

const buildMembers = (
  required: string[],
  properties: Record<string, JSONSchema4>,
  additionalProperties: boolean | JSONSchema4 = true,
): ts.TypeElement[] => {
  const members: ts.TypeElement[] = []

  for (const [key, value] of Object.entries(properties)) {
    const propertySignature = ts.factory.createPropertySignature(
      undefined,
      isIdentifierKey(key) ? ts.factory.createIdentifier(key) : ts.factory.createStringLiteral(key),
      !required.includes(key) ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
      getTsType(value),
    )
    members.push(propertySignature)
  }

  if (additionalProperties) {
    const indexSignature = ts.factory.createIndexSignature(
      undefined,
      [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          ts.factory.createIdentifier('key'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      ],
      typeof additionalProperties === 'boolean'
        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
        : getTsType(additionalProperties),
    )
    members.push(indexSignature)
  }

  return members
}

const buildInterface = (name: string, schema: JSONSchema4): ts.InterfaceDeclaration => {
  const required: string[] = Array.isArray(schema.required) ? schema.required : []

  const members = buildMembers(required, schema.properties || {}, schema.additionalProperties)

  const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(formatDefinitionName(name)),
    undefined,
    undefined,
    members,
  )

  if (schema.description) {
    ts.addSyntheticLeadingComment(
      interfaceDeclaration,
      ts.SyntaxKind.MultiLineCommentTrivia,
      `*\n * ${schema.description}\n `,
      true,
    )
  }

  ts.addSyntheticLeadingComment(
    interfaceDeclaration,
    ts.SyntaxKind.MultiLineCommentTrivia,
    `*\n * This interface was referenced by \`Config\`'s JSON-Schema\n * ${name} interface\n `,
    true,
  )

  return interfaceDeclaration
}

export const jsonSchemaToTypescript = (schema: JSONSchema4): string => {
  if (!schema.definitions) {
    schema.definitions = {}
  }

  const statements: ts.Statement[] = []

  if (schema.title && schema.type === 'object' && schema.properties) {
    statements.push(buildInterface(schema.title, schema))
  }

  for (const [defName, defSchema] of Object.entries(schema.definitions)) {
    statements.push(buildInterface(defName, defSchema))
  }

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  )

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

  const result = statements
    .map((statement) => printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile))
    .join('\n')

  return result
}
