import type { CallExpression, Expression, SourceFile, Type } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const LOCAL_API_METHODS = new Set([
  'count',
  'countGlobalVersions',
  'countVersions',
  'create',
  'delete',
  'duplicate',
  'find',
  'findByID',
  'findDistinct',
  'findGlobal',
  'findGlobalVersionByID',
  'findGlobalVersions',
  'findVersionByID',
  'findVersions',
  'forgotPassword',
  'login',
  'restoreGlobalVersion',
  'restoreVersion',
  'unlock',
  'update',
  'updateGlobal',
])

const JOBS_API_METHODS = new Set(['cancel', 'cancelByID', 'queue', 'run', 'runByID'])

type PayloadBindings = {
  getPayloadNames: Set<string>
  identifiers: Set<string>
  payloadTypeNames: Set<string>
}

export const addOverrideAccessTrue: Transform = {
  name: 'add-override-access-true',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const bindings = discoverPayloadBindings(sourceFile)
      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      const callsToChange: CallExpression[] = []

      for (const call of calls) {
        const match = classifyCall({ bindings, call })

        if (match === 'confirmed') {
          if (!hasOverrideAccess(call)) {
            const firstArgument = call.getArguments()[0]
            const unwrappedArgument =
              firstArgument && Node.isExpression(firstArgument)
                ? unwrapOptionsExpression(firstArgument)
                : undefined

            if (
              unwrappedArgument &&
              Node.isVoidExpression(unwrappedArgument) &&
              unwrappedArgument.getExpression().getText() !== '0'
            ) {
              const expression = call.getExpression()
              notes.push(
                `${sourceFile.getFilePath()}:${call.getStartLineNumber()}: could not safely rewrite a side-effecting void argument passed to \`${expression.getText()}\` — add \`overrideAccess: true\` manually if it should preserve the previous access-bypassing behavior.`,
              )
            } else if (call.getArguments().some(Node.isSpreadElement)) {
              const expression = call.getExpression()
              notes.push(
                `${sourceFile.getFilePath()}:${call.getStartLineNumber()}: could not safely rewrite spread arguments passed to \`${expression.getText()}\` — add \`overrideAccess: true\` manually if it should preserve the previous access-bypassing behavior.`,
              )
            } else {
              callsToChange.push(call)
            }
          }
        } else if (match === 'ambiguous' && !hasOverrideAccess(call)) {
          const expression = call.getExpression()
          notes.push(
            `${sourceFile.getFilePath()}:${call.getStartLineNumber()}: could not confirm that \`${expression.getText()}\` is a Payload Local API call — add \`overrideAccess: true\` manually if it should preserve the previous access-bypassing behavior.`,
          )
        }
      }

      for (const call of callsToChange.sort((a, b) => b.getStart() - a.getStart())) {
        addOverrideAccess(call)
      }

      if (callsToChange.length > 0) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged], ...(notes.length > 0 ? { notes } : {}) }
  },
  description:
    'Adds `overrideAccess: true` to confidently identified Payload Local API calls that omit it, preserving the previous default behavior after access enforcement became the default. Covers collection, global, auth, and jobs methods; preserves explicit values and reports ambiguous Payload-like calls for manual review.',
}

function discoverPayloadBindings(sourceFile: SourceFile): PayloadBindings {
  const bindings: PayloadBindings = {
    getPayloadNames: new Set<string>(),
    identifiers: new Set<string>(),
    payloadTypeNames: new Set<string>(),
  }

  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    for (const specifier of declaration.getNamedImports()) {
      const importedName = specifier.getName()
      const localName = specifier.getAliasNode()?.getText() ?? importedName

      if (importedName === 'getPayload') {
        bindings.getPayloadNames.add(localName)
      } else if (importedName === 'Payload') {
        bindings.payloadTypeNames.add(localName)
      }
    }
  }

  for (const parameter of sourceFile.getDescendantsOfKind(SyntaxKind.Parameter)) {
    if (
      Node.isIdentifier(parameter.getNameNode()) &&
      isPayloadTypeNode(parameter.getTypeNode(), bindings.payloadTypeNames)
    ) {
      bindings.identifiers.add(parameter.getName())
    }
  }

  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    if (
      Node.isIdentifier(declaration.getNameNode()) &&
      isPayloadTypeNode(declaration.getTypeNode(), bindings.payloadTypeNames)
    ) {
      bindings.identifiers.add(declaration.getName())
    }
  }

  let changed = true
  while (changed) {
    changed = false

    for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const nameNode = declaration.getNameNode()
      const initializer = declaration.getInitializer()

      if (!initializer || !Node.isIdentifier(nameNode)) {
        continue
      }

      if (
        !bindings.identifiers.has(nameNode.getText()) &&
        isKnownPayloadExpression(initializer, bindings)
      ) {
        bindings.identifiers.add(nameNode.getText())
        changed = true
      }
    }
  }

  return bindings
}

function isPayloadTypeNode(typeNode: Node | undefined, payloadTypeNames: Set<string>): boolean {
  if (!typeNode) {
    return false
  }

  if (Node.isTypeReference(typeNode)) {
    return payloadTypeNames.has(typeNode.getTypeName().getText())
  }

  if (Node.isUnionTypeNode(typeNode)) {
    const nonNullishTypes = typeNode
      .getTypeNodes()
      .filter((child) => !['null', 'undefined', 'void'].includes(child.getText()))

    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((child) => isPayloadTypeNode(child, payloadTypeNames))
    )
  }

  if (Node.isIntersectionTypeNode(typeNode)) {
    return typeNode.getTypeNodes().some((child) => isPayloadTypeNode(child, payloadTypeNames))
  }

  if (Node.isParenthesizedTypeNode(typeNode)) {
    return isPayloadTypeNode(typeNode.getTypeNode(), payloadTypeNames)
  }

  return false
}

function isKnownPayloadExpression(expression: Expression, bindings: PayloadBindings): boolean {
  const unwrapped = unwrapExpression(expression)

  if (Node.isIdentifier(unwrapped) && bindings.identifiers.has(unwrapped.getText())) {
    return true
  }

  if (Node.isCallExpression(unwrapped)) {
    const callee = unwrapped.getExpression()
    if (Node.isIdentifier(callee) && bindings.getPayloadNames.has(callee.getText())) {
      return true
    }
  }

  if (
    Node.isPropertyAccessExpression(unwrapped) &&
    unwrapped.getName() === 'payload' &&
    isRequestLikeExpression(unwrapped.getExpression())
  ) {
    return true
  }

  if (Node.isAsExpression(unwrapped)) {
    if (isPayloadTypeNode(unwrapped.getTypeNode(), bindings.payloadTypeNames)) {
      return true
    }

    return isKnownPayloadExpression(unwrapped.getExpression(), bindings)
  }

  try {
    return isResolvedPayloadType(unwrapped.getType())
  } catch {
    return false
  }
}

function isResolvedPayloadType(type: Type): boolean {
  if (type.isUnion()) {
    const nonNullishTypes = type
      .getUnionTypes()
      .filter((candidate) => !candidate.isNull() && !candidate.isUndefined() && !candidate.isVoid())

    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((candidate) => isResolvedPayloadType(candidate))
    )
  }

  if (type.isIntersection()) {
    return type.getIntersectionTypes().some((candidate) => isResolvedPayloadType(candidate))
  }

  const symbols = [type.getAliasSymbol(), type.getSymbol()].filter((symbol) => symbol !== undefined)

  return symbols.some((symbol) =>
    symbol.getDeclarations().some((declaration) => {
      const filePath = declaration.getSourceFile().getFilePath().replaceAll('\\', '/')
      return (
        filePath.includes('/node_modules/payload/') ||
        filePath.includes('/packages/payload/src/') ||
        filePath.includes('/packages/payload/dist/')
      )
    }),
  )
}

function unwrapExpression(expression: Expression): Expression {
  let current = expression

  while (
    Node.isAwaitExpression(current) ||
    Node.isParenthesizedExpression(current) ||
    Node.isNonNullExpression(current)
  ) {
    current = current.getExpression()
  }

  return current
}

function isRequestLikeExpression(expression: Expression): boolean {
  if (Node.isIdentifier(expression)) {
    return /^(?:req|request)$/i.test(expression.getText())
  }

  return (
    Node.isPropertyAccessExpression(expression) && /^(?:req|request)$/i.test(expression.getName())
  )
}

function classifyCall({
  bindings,
  call,
}: {
  bindings: PayloadBindings
  call: CallExpression
}): 'ambiguous' | 'confirmed' | 'unrelated' {
  const callee = call.getExpression()
  if (!Node.isPropertyAccessExpression(callee)) {
    return 'unrelated'
  }

  const methodName = callee.getName()
  const receiver = callee.getExpression()

  if (LOCAL_API_METHODS.has(methodName)) {
    if (isKnownPayloadExpression(receiver, bindings)) {
      return 'confirmed'
    }
    return isPayloadLikeName(receiver) ? 'ambiguous' : 'unrelated'
  }

  if (
    JOBS_API_METHODS.has(methodName) &&
    Node.isPropertyAccessExpression(receiver) &&
    receiver.getName() === 'jobs'
  ) {
    const payloadReceiver = receiver.getExpression()
    if (
      isKnownPayloadExpression(payloadReceiver, bindings) ||
      (Node.isIdentifier(payloadReceiver) && payloadReceiver.getText() === 'payload')
    ) {
      return 'confirmed'
    }
    return isPayloadLikeName(payloadReceiver) ? 'ambiguous' : 'unrelated'
  }

  return 'unrelated'
}

function isPayloadLikeName(expression: Expression): boolean {
  if (Node.isIdentifier(expression)) {
    return /payload/i.test(expression.getText())
  }

  return false
}

function hasOverrideAccess(call: CallExpression): boolean {
  const firstArgument = call.getArguments()[0]
  if (!firstArgument || !Node.isExpression(firstArgument)) {
    return false
  }

  const options = unwrapOptionsExpression(firstArgument)
  if (!Node.isObjectLiteralExpression(options)) {
    return false
  }

  if (options.getProperty('overrideAccess')) {
    return true
  }

  return options.getProperties().some((property) => {
    if (!Node.isSpreadAssignment(property)) {
      return false
    }

    const expression = unwrapOptionsExpression(property.getExpression())
    return (
      Node.isObjectLiteralExpression(expression) &&
      Boolean(expression.getProperty('overrideAccess'))
    )
  })
}

function unwrapOptionsExpression(expression: Expression): Expression {
  let current = expression

  while (
    Node.isAsExpression(current) ||
    Node.isParenthesizedExpression(current) ||
    Node.isSatisfiesExpression(current) ||
    Node.isTypeAssertion(current)
  ) {
    current = current.getExpression()
  }

  return current
}

function addOverrideAccess(call: CallExpression): void {
  const firstArgument = call.getArguments()[0]

  if (!firstArgument) {
    call.addArgument('{ overrideAccess: true }')
    return
  }

  if (Node.isExpression(firstArgument)) {
    const unwrappedArgument = unwrapOptionsExpression(firstArgument)
    if (
      Node.isNullLiteral(unwrappedArgument) ||
      (Node.isVoidExpression(unwrappedArgument) &&
        unwrappedArgument.getExpression().getText() === '0') ||
      (Node.isIdentifier(unwrappedArgument) && unwrappedArgument.getText() === 'undefined')
    ) {
      firstArgument.replaceWithText('{ overrideAccess: true }')
      return
    }
  }

  if (Node.isObjectLiteralExpression(firstArgument)) {
    const objectText = firstArgument.getText()
    const firstPropertyIndent = objectText.match(/\n([ \t]*)\S/)?.[1]
    const hasSpread = firstArgument.getProperties().some(Node.isSpreadAssignment)
    const defaultProperty = hasSpread ? '...{ overrideAccess: true }' : 'overrideAccess: true'

    if (firstPropertyIndent !== undefined) {
      firstArgument.replaceWithText(
        `{\n${firstPropertyIndent}${defaultProperty},${objectText.slice(1)}`,
      )
    } else {
      const existingProperties = objectText.slice(1, -1).trim()
      firstArgument.replaceWithText(
        existingProperties
          ? `{ ${defaultProperty}, ${existingProperties} }`
          : '{ overrideAccess: true }',
      )
    }
    return
  }

  const expressionText = firstArgument.getText()
  const spreadText =
    Node.isIdentifier(firstArgument) ||
    Node.isPropertyAccessExpression(firstArgument) ||
    Node.isCallExpression(firstArgument)
      ? expressionText
      : `(${expressionText})`

  firstArgument.replaceWithText(`{ ...{ overrideAccess: true }, ...${spreadText} }`)
}
