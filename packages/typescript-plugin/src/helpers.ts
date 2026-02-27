import type tslib from 'typescript/lib/tsserverlibrary'

export type PayloadComponentContext =
  | { exportNameValue?: string; node: tslib.StringLiteral; type: 'path' }
  | { node: tslib.StringLiteral; pathValue?: string; type: 'exportName' }
  | { node: tslib.StringLiteral; type: 'string' }

/**
 * Determines if a string literal is in a PayloadComponent context and what kind.
 *
 * - `'string'`: direct string form, e.g. `Field: '@/components/MyField#MyField'`
 * - `'path'`: the `path` property in the object form, e.g. `{ path: '@/components/MyField' }`
 * - `'exportName'`: the `exportName` property in the object form, e.g. `{ exportName: 'MyField' }`
 */
export function getPayloadComponentContext(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  checker: tslib.TypeChecker,
): PayloadComponentContext | undefined {
  const contextualType = checker.getContextualType(node)
  if (contextualType && isPayloadComponentType(ts, contextualType)) {
    return { type: 'string', node }
  }

  if (ts.isPropertyAssignment(node.parent) && ts.isObjectLiteralExpression(node.parent.parent)) {
    const propName = ts.isIdentifier(node.parent.name)
      ? node.parent.name.text
      : node.parent.name.getText()
    const objectLiteral = node.parent.parent
    const objectContextualType = checker.getContextualType(objectLiteral)

    if (objectContextualType && isRawPayloadComponentType(ts, objectContextualType)) {
      if (propName === 'path') {
        const exportNameValue = findSiblingStringProp(ts, objectLiteral, 'exportName')
        return { type: 'path', exportNameValue, node }
      }

      if (propName === 'exportName') {
        const pathValue = findSiblingStringProp(ts, objectLiteral, 'path')
        return { type: 'exportName', node, pathValue }
      }
    }
  }

  return undefined
}

function findSiblingStringProp(
  ts: typeof tslib,
  objectLiteral: tslib.ObjectLiteralExpression,
  name: string,
): string | undefined {
  const prop = objectLiteral.properties.find(
    (p): p is tslib.PropertyAssignment =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === name &&
      ts.isStringLiteral(p.initializer),
  )
  return prop && ts.isStringLiteral(prop.initializer) ? prop.initializer.text : undefined
}

/**
 * Checks whether a type is `PayloadComponent` (the union `false | RawPayloadComponent<...> | string`).
 *
 * Uses both alias name matching and a structural check so this catches `PayloadComponent`,
 * `CustomComponent`, and any other alias that resolves to the same shape.
 */
function isPayloadComponentType(ts: typeof tslib, type: tslib.Type): boolean {
  const aliasName = type.aliasSymbol?.name
  if (
    aliasName === 'PayloadComponent' ||
    aliasName === 'CustomComponent' ||
    aliasName === 'DocumentViewComponent'
  ) {
    return true
  }

  if (!type.isUnion()) {
    return false
  }

  let hasString = false
  let hasComponentShape = false

  for (const member of type.types) {
    if (member.flags & ts.TypeFlags.String) {
      hasString = true
    }

    if (member.flags & ts.TypeFlags.Object && member.getProperty('path')) {
      hasComponentShape = true
    }
  }

  return hasString && hasComponentShape
}

/**
 * Checks whether a type is `RawPayloadComponent` (an object with `path: string`
 * and optional `exportName: string`).
 */
function isRawPayloadComponentType(ts: typeof tslib, type: tslib.Type): boolean {
  const aliasName = type.aliasSymbol?.name
  if (aliasName === 'RawPayloadComponent') {
    return true
  }

  if (type.flags & ts.TypeFlags.Object) {
    return Boolean(type.getProperty('path') && type.getProperty('exportName'))
  }

  if (type.isUnion()) {
    return type.types.some(
      (member) =>
        member.flags & ts.TypeFlags.Object &&
        member.getProperty('path') &&
        member.getProperty('exportName'),
    )
  }

  return false
}

/**
 * Finds the most specific AST node at a given position in the source file.
 */
export function findNodeAtPosition(
  sourceFile: tslib.SourceFile,
  position: number,
): tslib.Node | undefined {
  function find(node: tslib.Node): tslib.Node | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      let found: tslib.Node | undefined
      node.forEachChild((child) => {
        if (!found) {
          found = find(child)
        }
      })
      return found || node
    }
    return undefined
  }

  return find(sourceFile)
}
