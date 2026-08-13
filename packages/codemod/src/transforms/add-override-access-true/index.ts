import type {
  CallExpression,
  Expression,
  Symbol as MorphSymbol,
  ObjectBindingPattern,
  ObjectLiteralExpression,
  SourceFile,
  Type,
} from 'ts-morph'

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
const PAYLOAD_TYPE_NAMES = new Set(['BasePayload', 'Payload'])

type PayloadBindings = {
  apiMethodSymbols: Set<MorphSymbol>
  getPayloadSymbols: Set<MorphSymbol>
  jobsSymbols: Set<MorphSymbol>
  payloadSymbols: Set<MorphSymbol>
  payloadTypeSymbols: Set<MorphSymbol>
}

type PayloadBindingsMutation = {
  bindings: PayloadBindings
  hasChanged: boolean
}

export const addOverrideAccessTrue: Transform = {
  name: 'add-override-access-true',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const bindings = discoverPayloadBindings({ sourceFile })
      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      const callsToChange: CallExpression[] = []

      for (const call of calls) {
        const match = classifyCall({ bindings, call })

        if (match === 'confirmed') {
          if (!hasOverrideAccess({ call })) {
            const firstArgument = call.getArguments()[0]
            const unwrappedArgument =
              firstArgument && Node.isExpression(firstArgument)
                ? unwrapOptionsExpression({ expression: firstArgument })
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
        } else if (match === 'ambiguous' && !hasOverrideAccess({ call })) {
          const expression = call.getExpression()
          notes.push(
            `${sourceFile.getFilePath()}:${call.getStartLineNumber()}: could not confirm that \`${expression.getText()}\` is a Payload Local API call — add \`overrideAccess: true\` manually if it should preserve the previous access-bypassing behavior.`,
          )
        }
      }

      for (const call of callsToChange.sort((a, b) => b.getStart() - a.getStart())) {
        addOverrideAccess({ call })
      }

      if (callsToChange.length > 0) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged], ...(notes.length > 0 ? { notes } : {}) }
  },
  description:
    'Adds `overrideAccess: true` to confidently identified Payload Local API calls that omit it, preserving the previous default behavior after access enforcement became the default. Covers collection, global, auth, and jobs methods; preserves explicit values and reports ambiguous Payload-like calls for manual review.',
  shouldLoadAllSourceFiles: true,
}

function discoverPayloadBindings({ sourceFile }: { sourceFile: SourceFile }): PayloadBindings {
  let bindings: PayloadBindings = {
    apiMethodSymbols: new Set<MorphSymbol>(),
    getPayloadSymbols: new Set<MorphSymbol>(),
    jobsSymbols: new Set<MorphSymbol>(),
    payloadSymbols: new Set<MorphSymbol>(),
    payloadTypeSymbols: new Set<MorphSymbol>(),
  }

  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    for (const specifier of declaration.getNamedImports()) {
      const importedName = specifier.getName()
      const localIdentifier = specifier.getAliasNode() ?? specifier.getNameNode()
      const symbol = localIdentifier.getSymbol()

      if (!symbol) {
        continue
      }

      if (importedName === 'getPayload') {
        bindings.getPayloadSymbols.add(symbol)
      } else if (PAYLOAD_TYPE_NAMES.has(importedName)) {
        bindings.payloadTypeSymbols.add(symbol)
      }
    }
  }

  for (const parameter of sourceFile.getDescendantsOfKind(SyntaxKind.Parameter)) {
    const nameNode = parameter.getNameNode()
    if (!isPayloadDeclaration({ bindings, declaration: parameter })) {
      continue
    }

    if (Node.isIdentifier(nameNode)) {
      const symbol = nameNode.getSymbol()
      if (symbol) {
        bindings.payloadSymbols.add(symbol)
      }
    } else if (Node.isObjectBindingPattern(nameNode)) {
      bindings = collectBindingPatternSymbols({
        apiKind: 'payload',
        bindingPattern: nameNode,
        bindings,
      }).bindings
    }
  }

  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const nameNode = declaration.getNameNode()
    if (!isPayloadDeclaration({ bindings, declaration })) {
      continue
    }

    if (Node.isIdentifier(nameNode)) {
      const symbol = nameNode.getSymbol()
      if (symbol) {
        bindings.payloadSymbols.add(symbol)
      }
    } else if (Node.isObjectBindingPattern(nameNode)) {
      bindings = collectBindingPatternSymbols({
        apiKind: 'payload',
        bindingPattern: nameNode,
        bindings,
      }).bindings
    }
  }

  let hasChanged = true
  while (hasChanged) {
    hasChanged = false

    for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const nameNode = declaration.getNameNode()
      const initializer = declaration.getInitializer()

      if (!initializer) {
        continue
      }

      if (Node.isIdentifier(nameNode)) {
        const symbol = nameNode.getSymbol()
        if (!symbol) {
          continue
        }

        if (isKnownPayloadExpression({ bindings, expression: initializer })) {
          if (!bindings.payloadSymbols.has(symbol)) {
            bindings.payloadSymbols.add(symbol)
            hasChanged = true
          }
        } else if (isKnownJobsExpression({ bindings, expression: initializer })) {
          if (!bindings.jobsSymbols.has(symbol)) {
            bindings.jobsSymbols.add(symbol)
            hasChanged = true
          }
        } else if (isKnownAPIMethodExpression({ bindings, expression: initializer })) {
          if (!bindings.apiMethodSymbols.has(symbol)) {
            bindings.apiMethodSymbols.add(symbol)
            hasChanged = true
          }
        }
        continue
      }

      if (!Node.isObjectBindingPattern(nameNode)) {
        continue
      }

      if (isKnownPayloadExpression({ bindings, expression: initializer })) {
        const result = collectBindingPatternSymbols({
          apiKind: 'payload',
          bindingPattern: nameNode,
          bindings,
        })
        bindings = result.bindings
        hasChanged = result.hasChanged || hasChanged
      } else if (isKnownJobsExpression({ bindings, expression: initializer })) {
        const result = collectBindingPatternSymbols({
          apiKind: 'jobs',
          bindingPattern: nameNode,
          bindings,
        })
        bindings = result.bindings
        hasChanged = result.hasChanged || hasChanged
      }
    }

    for (const assignment of sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
      if (assignment.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
        continue
      }

      const left = assignment.getLeft()
      const right = assignment.getRight()

      if (Node.isIdentifier(left)) {
        const symbol = left.getSymbol()
        if (!symbol) {
          continue
        }

        if (
          isKnownPayloadExpression({ bindings, expression: right }) &&
          !bindings.payloadSymbols.has(symbol)
        ) {
          bindings.payloadSymbols.add(symbol)
          hasChanged = true
        } else if (
          isKnownJobsExpression({ bindings, expression: right }) &&
          !bindings.jobsSymbols.has(symbol)
        ) {
          bindings.jobsSymbols.add(symbol)
          hasChanged = true
        } else if (
          isKnownAPIMethodExpression({ bindings, expression: right }) &&
          !bindings.apiMethodSymbols.has(symbol)
        ) {
          bindings.apiMethodSymbols.add(symbol)
          hasChanged = true
        }
      } else if (Node.isObjectLiteralExpression(left)) {
        if (isKnownPayloadExpression({ bindings, expression: right })) {
          const result = collectAssignmentPatternSymbols({
            apiKind: 'payload',
            bindings,
            objectLiteral: left,
          })
          bindings = result.bindings
          hasChanged = result.hasChanged || hasChanged
        } else if (isKnownJobsExpression({ bindings, expression: right })) {
          const result = collectAssignmentPatternSymbols({
            apiKind: 'jobs',
            bindings,
            objectLiteral: left,
          })
          bindings = result.bindings
          hasChanged = result.hasChanged || hasChanged
        }
      }
    }
  }

  return bindings
}

function collectAssignmentPatternSymbols({
  apiKind,
  bindings,
  objectLiteral,
}: {
  apiKind: 'jobs' | 'payload'
  bindings: PayloadBindings
  objectLiteral: ObjectLiteralExpression
}): PayloadBindingsMutation {
  const apiMethods = apiKind === 'payload' ? LOCAL_API_METHODS : JOBS_API_METHODS
  let hasChanged = false

  for (const property of objectLiteral.getProperties()) {
    if (Node.isShorthandPropertyAssignment(property)) {
      const methodName = property.getName()
      const symbol = property.getValueSymbol()

      if (apiMethods.has(methodName) && symbol && !bindings.apiMethodSymbols.has(symbol)) {
        bindings.apiMethodSymbols.add(symbol)
        hasChanged = true
      } else if (
        apiKind === 'payload' &&
        methodName === 'jobs' &&
        symbol &&
        !bindings.jobsSymbols.has(symbol)
      ) {
        bindings.jobsSymbols.add(symbol)
        hasChanged = true
      }
      continue
    }

    if (!Node.isPropertyAssignment(property)) {
      continue
    }

    const methodName = property.getName()
    const initializer = property.getInitializer()
    if (!initializer) {
      continue
    }

    if (apiKind === 'payload' && methodName === 'jobs') {
      if (Node.isObjectLiteralExpression(initializer)) {
        const result = collectAssignmentPatternSymbols({
          apiKind: 'jobs',
          bindings,
          objectLiteral: initializer,
        })
        bindings = result.bindings
        hasChanged = result.hasChanged || hasChanged
      } else if (Node.isIdentifier(initializer)) {
        const symbol = initializer.getSymbol()
        if (symbol && !bindings.jobsSymbols.has(symbol)) {
          bindings.jobsSymbols.add(symbol)
          hasChanged = true
        }
      }
    } else if (apiMethods.has(methodName) && Node.isIdentifier(initializer)) {
      const symbol = initializer.getSymbol()
      if (symbol && !bindings.apiMethodSymbols.has(symbol)) {
        bindings.apiMethodSymbols.add(symbol)
        hasChanged = true
      }
    }
  }

  return { bindings, hasChanged }
}

function collectBindingPatternSymbols({
  apiKind,
  bindingPattern,
  bindings,
}: {
  apiKind: 'jobs' | 'payload'
  bindingPattern: ObjectBindingPattern
  bindings: PayloadBindings
}): PayloadBindingsMutation {
  const apiMethods = apiKind === 'payload' ? LOCAL_API_METHODS : JOBS_API_METHODS
  let hasChanged = false

  for (const element of bindingPattern.getElements()) {
    if (element.getDotDotDotToken()) {
      continue
    }

    const localName = element.getNameNode()
    const methodName = element.getPropertyNameNode()?.getText() ?? localName.getText()

    if (apiKind === 'payload' && methodName === 'jobs') {
      if (Node.isObjectBindingPattern(localName)) {
        const result = collectBindingPatternSymbols({
          apiKind: 'jobs',
          bindingPattern: localName,
          bindings,
        })
        bindings = result.bindings
        hasChanged = result.hasChanged || hasChanged
      } else if (Node.isIdentifier(localName)) {
        const symbol = localName.getSymbol()
        if (symbol && !bindings.jobsSymbols.has(symbol)) {
          bindings.jobsSymbols.add(symbol)
          hasChanged = true
        }
      }
    } else if (apiMethods.has(methodName) && Node.isIdentifier(localName)) {
      const symbol = localName.getSymbol()
      if (symbol && !bindings.apiMethodSymbols.has(symbol)) {
        bindings.apiMethodSymbols.add(symbol)
        hasChanged = true
      }
    }
  }

  return { bindings, hasChanged }
}

function isPayloadDeclaration({
  bindings,
  declaration,
}: {
  bindings: PayloadBindings
  declaration: { getType: () => Type; getTypeNode: () => Node | undefined }
}): boolean {
  return (
    isPayloadTypeNode({
      payloadTypeSymbols: bindings.payloadTypeSymbols,
      typeNode: declaration.getTypeNode(),
    }) || isResolvedPayloadType({ type: declaration.getType() })
  )
}

function isKnownAPIMethodExpression({
  bindings,
  expression,
}: {
  bindings: PayloadBindings
  expression: Expression
}): boolean {
  const unwrapped = unwrapExpression({ expression })

  if (Node.isIdentifier(unwrapped)) {
    const symbol = unwrapped.getSymbol()
    return Boolean(symbol && bindings.apiMethodSymbols.has(symbol))
  }

  if (!Node.isPropertyAccessExpression(unwrapped)) {
    return false
  }

  const methodName = unwrapped.getName()
  const receiver = unwrapped.getExpression()

  return (
    (LOCAL_API_METHODS.has(methodName) &&
      isKnownPayloadExpression({ bindings, expression: receiver })) ||
    (JOBS_API_METHODS.has(methodName) && isKnownJobsExpression({ bindings, expression: receiver }))
  )
}

function isKnownJobsExpression({
  bindings,
  expression,
}: {
  bindings: PayloadBindings
  expression: Expression
}): boolean {
  const unwrapped = unwrapExpression({ expression })

  if (Node.isIdentifier(unwrapped)) {
    const symbol = unwrapped.getSymbol()
    return Boolean(symbol && bindings.jobsSymbols.has(symbol))
  }

  return (
    Node.isPropertyAccessExpression(unwrapped) &&
    unwrapped.getName() === 'jobs' &&
    isKnownPayloadExpression({ bindings, expression: unwrapped.getExpression() })
  )
}

function isPayloadTypeNode({
  payloadTypeSymbols,
  typeNode,
}: {
  payloadTypeSymbols: Set<MorphSymbol>
  typeNode: Node | undefined
}): boolean {
  if (!typeNode) {
    return false
  }

  if (Node.isTypeReference(typeNode)) {
    const symbol = typeNode.getTypeName().getSymbol()
    return Boolean(symbol && payloadTypeSymbols.has(symbol))
  }

  if (Node.isUnionTypeNode(typeNode)) {
    const nonNullishTypes = typeNode
      .getTypeNodes()
      .filter((child) => !['null', 'undefined', 'void'].includes(child.getText()))

    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((child) => isPayloadTypeNode({ payloadTypeSymbols, typeNode: child }))
    )
  }

  if (Node.isIntersectionTypeNode(typeNode)) {
    return typeNode
      .getTypeNodes()
      .some((child) => isPayloadTypeNode({ payloadTypeSymbols, typeNode: child }))
  }

  if (Node.isParenthesizedTypeNode(typeNode)) {
    return isPayloadTypeNode({ payloadTypeSymbols, typeNode: typeNode.getTypeNode() })
  }

  return false
}

function isKnownPayloadExpression({
  bindings,
  expression,
}: {
  bindings: PayloadBindings
  expression: Expression
}): boolean {
  const unwrapped = unwrapExpression({ expression })

  if (Node.isIdentifier(unwrapped)) {
    const symbol = unwrapped.getSymbol()
    if (symbol && bindings.payloadSymbols.has(symbol)) {
      return true
    }
  }

  if (Node.isCallExpression(unwrapped)) {
    const callee = unwrapped.getExpression()
    if (Node.isIdentifier(callee)) {
      const symbol = callee.getSymbol()
      if (symbol && bindings.getPayloadSymbols.has(symbol)) {
        return true
      }
    }
  }

  if (
    Node.isPropertyAccessExpression(unwrapped) &&
    unwrapped.getName() === 'payload' &&
    isRequestLikeExpression({ expression: unwrapped.getExpression() })
  ) {
    return true
  }

  if (Node.isAsExpression(unwrapped)) {
    if (
      isPayloadTypeNode({
        payloadTypeSymbols: bindings.payloadTypeSymbols,
        typeNode: unwrapped.getTypeNode(),
      })
    ) {
      return true
    }

    return isKnownPayloadExpression({ bindings, expression: unwrapped.getExpression() })
  }

  try {
    return isResolvedPayloadType({ type: unwrapped.getType() })
  } catch {
    return false
  }
}

function isResolvedPayloadType({ type }: { type: Type }): boolean {
  if (type.isUnion()) {
    const nonNullishTypes = type
      .getUnionTypes()
      .filter((candidate) => !candidate.isNull() && !candidate.isUndefined() && !candidate.isVoid())

    return (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((candidate) => isResolvedPayloadType({ type: candidate }))
    )
  }

  if (type.isIntersection()) {
    return type
      .getIntersectionTypes()
      .some((candidate) => isResolvedPayloadType({ type: candidate }))
  }

  const symbols = [type.getAliasSymbol(), type.getSymbol()].filter((symbol) => symbol !== undefined)

  if (
    symbols.some(
      (symbol) =>
        PAYLOAD_TYPE_NAMES.has(symbol.getName()) &&
        symbol.getDeclarations().some((declaration) => {
          const filePath = declaration.getSourceFile().getFilePath().replaceAll('\\', '/')
          return (
            filePath.includes('/node_modules/payload/') ||
            filePath.includes('/packages/payload/src/') ||
            filePath.includes('/packages/payload/dist/')
          )
        }),
    )
  ) {
    return true
  }

  return type.getBaseTypes().some((baseType) => isResolvedPayloadType({ type: baseType }))
}

function unwrapExpression({ expression }: { expression: Expression }): Expression {
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

function isRequestLikeExpression({ expression }: { expression: Expression }): boolean {
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
  if (Node.isIdentifier(callee)) {
    const symbol = callee.getSymbol()
    return symbol && bindings.apiMethodSymbols.has(symbol) ? 'confirmed' : 'unrelated'
  }

  if (!Node.isPropertyAccessExpression(callee)) {
    return 'unrelated'
  }

  const methodName = callee.getName()
  const receiver = callee.getExpression()

  if (LOCAL_API_METHODS.has(methodName)) {
    if (isKnownPayloadExpression({ bindings, expression: receiver })) {
      return 'confirmed'
    }
    return isPayloadLikeName({ expression: receiver }) ? 'ambiguous' : 'unrelated'
  }

  if (
    JOBS_API_METHODS.has(methodName) &&
    Node.isPropertyAccessExpression(receiver) &&
    receiver.getName() === 'jobs'
  ) {
    const payloadReceiver = receiver.getExpression()
    if (isKnownJobsExpression({ bindings, expression: receiver })) {
      return 'confirmed'
    }
    return isPayloadLikeName({ expression: payloadReceiver }) ? 'ambiguous' : 'unrelated'
  }

  return 'unrelated'
}

function isPayloadLikeName({ expression }: { expression: Expression }): boolean {
  if (Node.isIdentifier(expression)) {
    return /payload/i.test(expression.getText())
  }

  return false
}

function hasOverrideAccess({ call }: { call: CallExpression }): boolean {
  const firstArgument = call.getArguments()[0]
  if (!firstArgument || !Node.isExpression(firstArgument)) {
    return false
  }

  const options = unwrapOptionsExpression({ expression: firstArgument })
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

    const expression = unwrapOptionsExpression({ expression: property.getExpression() })
    return (
      Node.isObjectLiteralExpression(expression) &&
      Boolean(expression.getProperty('overrideAccess'))
    )
  })
}

function unwrapOptionsExpression({ expression }: { expression: Expression }): Expression {
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

function addOverrideAccess({ call }: { call: CallExpression }): CallExpression {
  const firstArgument = call.getArguments()[0]

  if (!firstArgument) {
    call.addArgument('{ overrideAccess: true }')
    return call
  }

  if (Node.isExpression(firstArgument)) {
    const unwrappedArgument = unwrapOptionsExpression({ expression: firstArgument })
    if (
      Node.isNullLiteral(unwrappedArgument) ||
      (Node.isVoidExpression(unwrappedArgument) &&
        unwrappedArgument.getExpression().getText() === '0') ||
      (Node.isIdentifier(unwrappedArgument) && unwrappedArgument.getText() === 'undefined')
    ) {
      firstArgument.replaceWithText('{ overrideAccess: true }')
      return call
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
    return call
  }

  const expressionText = firstArgument.getText()
  const spreadText =
    Node.isIdentifier(firstArgument) ||
    Node.isPropertyAccessExpression(firstArgument) ||
    Node.isCallExpression(firstArgument)
      ? expressionText
      : `(${expressionText})`

  firstArgument.replaceWithText(`{ ...{ overrideAccess: true }, ...${spreadText} }`)

  return call
}
