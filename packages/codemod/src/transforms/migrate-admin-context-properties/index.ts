import type { Identifier, ObjectBindingPattern, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

type Paths = Map<string, readonly string[]>

/** Removed `AdminContext` properties mapped to where each value lives now. */
const ADMIN_CONTEXT_PATHS: Paths = new Map([
  ['headers', ['req', 'headers']],
  ['languageCode', ['req', 'i18n', 'language']],
])

const PARTIAL_ADMIN_CONTEXT_PATHS: Paths = new Map([['languageCode', ['i18n', 'language']]])

type ImportKind = 'context' | 'getRootLayoutData' | 'initAdminContext'

// Pre-rename names are accepted so this transform also works without `migrate-payload-request-creation`.
const IMPORTS: Record<string, Record<string, { kind: ImportKind; paths: Paths }>> = {
  '@payloadcms/ui/layouts/Root/getRootLayoutData': {
    getRootLayoutData: { kind: 'getRootLayoutData', paths: ADMIN_CONTEXT_PATHS },
  },
  payload: {
    AdminContext: { kind: 'context', paths: ADMIN_CONTEXT_PATHS },
    InitReqResult: { kind: 'context', paths: ADMIN_CONTEXT_PATHS },
  },
  'payload/internal': {
    initAdminContext: { kind: 'initAdminContext', paths: ADMIN_CONTEXT_PATHS },
    initReq: { kind: 'initAdminContext', paths: ADMIN_CONTEXT_PATHS },
    InitReqPartialResult: { kind: 'context', paths: PARTIAL_ADMIN_CONTEXT_PATHS },
    PartialAdminContext: { kind: 'context', paths: PARTIAL_ADMIN_CONTEXT_PATHS },
  },
}

type State = {
  /** Replacement text keyed by node, so a node reached twice is only rewritten once. */
  edits: Map<Node, string>
  file: SourceFile
  notes: string[]
  /** Removed properties whose reads were rewritten. */
  rewritten: Set<string>
}

export const migrateAdminContextProperties: Transform = {
  name: 'migrate-admin-context-properties',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      const imports = file.getImportDeclarations().flatMap((declaration) => {
        const source = declaration.getModuleSpecifierValue()

        if (!Object.hasOwn(IMPORTS, source)) {
          return []
        }

        return declaration.getNamedImports().flatMap((spec) => {
          const name = spec.getAliasNode() ?? spec.getNameNode()

          return Object.hasOwn(IMPORTS[source]!, spec.getName()) && Node.isIdentifier(name)
            ? [{ ...IMPORTS[source]![spec.getName()]!, name }]
            : []
        })
      })

      if (imports.length === 0) {
        continue
      }

      const original = file.getFullText()

      // `getRootLayoutData` reads both values from `req` now. Removing these arguments first lets
      // the destructures below drop bindings that only fed this call.
      for (const { name, kind } of imports) {
        if (kind !== 'getRootLayoutData') {
          continue
        }

        for (const reference of getReferences({ name, file })) {
          const call = reference.getParent()
          const [argument] =
            Node.isCallExpression(call) && call.getExpression() === reference
              ? call.getArguments()
              : []

          if (!Node.isObjectLiteralExpression(argument)) {
            continue
          }

          for (const property of argument.getProperties()) {
            if (
              (Node.isPropertyAssignment(property) ||
                Node.isShorthandPropertyAssignment(property)) &&
              ADMIN_CONTEXT_PATHS.has(property.getName())
            ) {
              property.remove()
            }
          }
        }
      }

      const state: State = { edits: new Map(), file, notes, rewritten: new Set() }

      for (const { name, kind, paths } of imports) {
        for (const reference of kind === 'getRootLayoutData' ? [] : getReferences({ name, file })) {
          const parent = reference.getParent()

          if (kind === 'initAdminContext') {
            if (!Node.isCallExpression(parent) || parent.getExpression() !== reference) {
              continue
            }

            let expression: Node = parent

            while (
              Node.isAwaitExpression(expression.getParent()) ||
              Node.isParenthesizedExpression(expression.getParent())
            ) {
              expression = expression.getParentOrThrow()
            }

            collectExpression({ allowAlias: true, expression, paths, state })
            continue
          }

          if (!Node.isTypeReference(parent) || parent.getTypeName() !== reference) {
            continue
          }

          const owner = parent.getParent()

          if (
            (Node.isParameterDeclaration(owner) || Node.isVariableDeclaration(owner)) &&
            owner.getTypeNode() === parent
          ) {
            collectBinding({ binding: owner.getNameNode(), paths, state })
          } else if (Node.isIndexedAccessTypeNode(owner) && owner.getObjectTypeNode() === parent) {
            const index = owner.getIndexTypeNode()
            const literal = Node.isLiteralTypeNode(index) ? index.getLiteral() : undefined
            const property = Node.isStringLiteral(literal) ? literal.getLiteralValue() : undefined
            const path = property === undefined ? undefined : paths.get(property)

            if (path) {
              state.edits.set(
                owner,
                `${parent.getText()}${path.map((key) => `['${key}']`).join('')}`,
              )
              state.rewritten.add(property!)
            }
          } else if (
            Node.isTypeReference(owner) &&
            owner.getTypeName().getText() === 'Pick' &&
            owner.getTypeArguments()[0] === parent
          ) {
            const keys = owner.getTypeArguments()[1]
            const members = Node.isUnionTypeNode(keys) ? keys.getTypeNodes() : keys ? [keys] : []
            const remaining = members.filter((member) => {
              const literal = Node.isLiteralTypeNode(member) ? member.getLiteral() : undefined
              return !(Node.isStringLiteral(literal) && paths.has(literal.getLiteralValue()))
            })

            if (remaining.length === members.length) {
              continue
            }

            if (remaining.length === 0) {
              notes.push(
                `${file.getFilePath()}:${owner.getStartLineNumber()}: \`${owner.getText()}\` only picks properties removed in v4; migrate manually.`,
              )
              continue
            }

            state.edits.set(keys!, remaining.map((member) => member.getText()).join(' | '))
          }
        }
      }

      // Apply from the end of the file so earlier edits don't shift later nodes.
      for (const [node, text] of [...state.edits].sort(([a], [b]) => b.getStart() - a.getStart())) {
        node.replaceWithText(text)
      }

      if (state.rewritten.has('languageCode')) {
        notes.push(
          `${file.getFilePath()}: \`languageCode\` reads now use \`i18n.language\`, which is typed as \`string\` instead of \`AcceptedLanguages\`. Cast where the narrower type is required.`,
        )
      }

      if (file.getFullText() !== original) {
        filesChanged.push(file.getFilePath())
      }
    }

    return {
      filesChanged,
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Rewrites reads of `headers` and `languageCode`, removed from `AdminContext` in v4, to `req.headers` and `req.i18n.language`. Covers `initAdminContext()` results, bindings typed as `AdminContext` or `PartialAdminContext`, and `Pick`/indexed access types, and drops both arguments from `getRootLayoutData()` calls.',
}

/** Same-file identifiers bound to the same symbol as `name`. */
function getReferences({ name, file }: { file: SourceFile; name: Identifier }): Identifier[] {
  const symbol = name.getSymbol()?.compilerSymbol

  if (!symbol) {
    return []
  }

  return file
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .filter(
      (identifier) =>
        identifier !== name &&
        identifier.getText() === name.getText() &&
        identifier.getSymbol()?.compilerSymbol === symbol,
    )
}

/** Handles a variable or parameter name that holds an admin context. */
function collectBinding({
  binding,
  paths,
  state,
}: {
  binding: Node
  paths: Paths
  state: State
}): void {
  if (Node.isObjectBindingPattern(binding)) {
    collectPattern({ paths, pattern: binding, state })
    return
  }

  if (!Node.isIdentifier(binding)) {
    return
  }

  for (const reference of binding.findReferencesAsNodes()) {
    if (reference !== binding && reference.getSourceFile() === state.file) {
      collectExpression({ allowAlias: false, expression: reference, paths, state })
    }
  }
}

/** Handles an expression that evaluates to an admin context. */
function collectExpression({
  allowAlias,
  expression,
  paths,
  state,
}: {
  /** Whether to follow `const context = <expression>` to the uses of `context`. */
  allowAlias: boolean
  expression: Node
  paths: Paths
  state: State
}): void {
  const parent = expression.getParent()

  if (Node.isPropertyAccessExpression(parent) && parent.getExpression() === expression) {
    const path = paths.get(parent.getName())

    if (path) {
      state.edits.set(
        parent,
        `${expression.getText()}${parent.hasQuestionDotToken() ? '?.' : '.'}${path.join('.')}`,
      )
      state.rewritten.add(parent.getName())
    }
  } else if (Node.isElementAccessExpression(parent) && parent.getExpression() === expression) {
    const argument = parent.getArgumentExpression()
    const path = Node.isStringLiteral(argument) ? paths.get(argument.getLiteralValue()) : undefined

    if (path) {
      state.notes.push(
        `${state.file.getFilePath()}:${parent.getStartLineNumber()}: \`${parent.getText()}\` reads a property removed in v4; migrate manually to \`${expression.getText()}.${path.join('.')}\`.`,
      )
    }
  } else if (Node.isVariableDeclaration(parent) && parent.getInitializer() === expression) {
    const name = parent.getNameNode()

    if (Node.isObjectBindingPattern(name) || allowAlias) {
      collectBinding({ binding: name, paths, state })
    }
  }
}

type Tree = Map<string, string | Tree>

/**
 * Moves removed properties out of a destructure into nested patterns, e.g.
 * `{ headers, user }` becomes `{ req: { headers }, user }`. Bindings that are never read are dropped.
 */
function collectPattern({
  paths,
  pattern,
  state,
}: {
  paths: Paths
  pattern: ObjectBindingPattern
  state: State
}): void {
  const kept: string[] = []
  const moved: Tree = new Map()
  let insertIndex = -1

  for (const element of pattern.getElements()) {
    const propertyNameNode = element.getPropertyNameNode()
    const nameNode = element.getNameNode()
    const property = !propertyNameNode
      ? nameNode.getText()
      : Node.isIdentifier(propertyNameNode)
        ? propertyNameNode.getText()
        : Node.isStringLiteral(propertyNameNode)
          ? propertyNameNode.getLiteralValue()
          : undefined
    const path =
      element.getDotDotDotToken() || property === undefined ? undefined : paths.get(property)

    if (!path) {
      kept.push(element.getText())
      continue
    }

    if (insertIndex === -1) {
      insertIndex = kept.length
    }

    if (
      Node.isIdentifier(nameNode) &&
      nameNode.findReferencesAsNodes().every((reference) => reference === nameNode)
    ) {
      continue
    }

    let level = moved

    for (const key of path.slice(0, -1)) {
      const next = level.get(key)
      const child = next instanceof Map ? next : new Map<string, string | Tree>()
      level.set(key, child)
      level = child
    }

    const leaf = path.at(-1)!
    const initializer = element.getInitializer()

    level.set(
      leaf,
      `${leaf === nameNode.getText() ? leaf : `${leaf}: ${nameNode.getText()}`}${initializer ? ` = ${initializer.getText()}` : ''}`,
    )
    state.rewritten.add(property!)
  }

  if (insertIndex === -1) {
    return
  }

  kept.splice(insertIndex, 0, ...renderTree(moved))
  state.edits.set(pattern, `{ ${kept.join(', ')} }`)
}

function renderTree(tree: Tree): string[] {
  return [...tree].map(([key, value]) =>
    typeof value === 'string' ? value : `${key}: { ${renderTree(value).join(', ')} }`,
  )
}
