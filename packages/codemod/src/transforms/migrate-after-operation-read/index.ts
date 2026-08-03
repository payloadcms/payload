import type {
  ArrowFunction,
  BinaryExpression,
  FunctionExpression,
  PropertyAssignment,
  Node as TsNode,
} from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const EQUALITY_OPERATORS = new Set(['==', '==='])
const INEQUALITY_OPERATORS = new Set(['!=', '!=='])

type HookFunction = ArrowFunction | FunctionExpression

export const migrateAfterOperationRead: Transform = {
  name: 'migrate-after-operation-read',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      const afterOperationProps = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'afterOperation' && isHookArray(prop))

      for (const prop of afterOperationProps) {
        const initializer = prop.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)!
        const filePath = sourceFile.getFilePath()

        for (const element of initializer.getElements()) {
          if (!Node.isArrowFunction(element) && !Node.isFunctionExpression(element)) {
            notes.push(
              `${filePath}: afterOperation hook is not an inline function — if it branches on \`operation === 'read'\`, update it to handle 'find' and 'findByID' manually.`,
            )
            continue
          }

          const operationExpr = getOperationExpr(element)
          if (!operationExpr) {
            if (referencesReadLiteral(element)) {
              notes.push(
                `${filePath}: could not locate the \`operation\` argument of an afterOperation hook — update any \`operation === 'read'\` checks to handle 'find' and 'findByID' manually.`,
              )
            }
            continue
          }

          if (hasReadSwitchCase({ fn: element, operationExpr })) {
            notes.push(
              `${filePath}: afterOperation hook switches on \`${operationExpr}\` with a 'read' case — replace it with 'find' and 'findByID' cases manually.`,
            )
          }

          if (rewriteReadComparisons({ fn: element, operationExpr })) {
            mutated = true
          }
        }
      }

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged], ...(notes.length > 0 ? { notes } : {}) }
  },
  description:
    "Rewrites `operation === 'read'` checks in collection `afterOperation` hooks to handle the `find` and `findByID` operations, since the deprecated `'read'` value was removed. Handles `===`/`!==`/`==`/`!=` against destructured (and aliased) or property-accessed `operation` arguments. Leaves `beforeOperation` (which still uses `'read'`) untouched and surfaces notes for non-inline hooks and `switch` cases that need manual review.",
}

function isHookArray(prop: PropertyAssignment): boolean {
  return prop.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression) !== undefined
}

/**
 * Resolve the text used to reference the `operation` argument inside a hook —
 * either the local name from a destructured (possibly aliased) first parameter,
 * or `<param>.operation` when the first parameter is a plain identifier.
 */
function getOperationExpr(fn: HookFunction): string | undefined {
  const param = fn.getParameters()[0]
  if (!param) {
    return undefined
  }

  const nameNode = param.getNameNode()

  if (Node.isObjectBindingPattern(nameNode)) {
    for (const element of nameNode.getElements()) {
      const sourceProp = element.getPropertyNameNode()?.getText() ?? element.getNameNode().getText()
      if (sourceProp === 'operation') {
        return element.getNameNode().getText()
      }
    }
    return undefined
  }

  if (Node.isIdentifier(nameNode)) {
    return `${nameNode.getText()}.operation`
  }

  return undefined
}

type RewriteArgs = {
  fn: HookFunction
  operationExpr: string
}

function rewriteReadComparisons({ fn, operationExpr }: RewriteArgs): boolean {
  let changed = false

  // Replace one match at a time and re-query: replaceWithText re-parses the
  // changed range, so collecting node refs up front would leave them stale.
  while (true) {
    const match = fn
      .getDescendantsOfKind(SyntaxKind.BinaryExpression)
      .find((binary) => isReadComparison({ binary, operationExpr }))

    if (!match) {
      break
    }

    const operator = match.getOperatorToken().getText()
    const joiner = EQUALITY_OPERATORS.has(operator) ? '||' : '&&'
    const expanded = `${operationExpr} ${operator} 'find' ${joiner} ${operationExpr} ${operator} 'findByID'`

    match.replaceWithText(needsParens(match) ? `(${expanded})` : expanded)
    changed = true
  }

  return changed
}

type ReadComparisonArgs = {
  binary: BinaryExpression
  operationExpr: string
}

function isReadComparison({ binary, operationExpr }: ReadComparisonArgs): boolean {
  const operator = binary.getOperatorToken().getText()
  if (!EQUALITY_OPERATORS.has(operator) && !INEQUALITY_OPERATORS.has(operator)) {
    return false
  }

  const left = binary.getLeft()
  const right = binary.getRight()

  return (
    (isOperationOperand(left, operationExpr) && isReadLiteral(right)) ||
    (isReadLiteral(left) && isOperationOperand(right, operationExpr))
  )
}

function isOperationOperand(node: TsNode, operationExpr: string): boolean {
  return (
    (Node.isIdentifier(node) || Node.isPropertyAccessExpression(node)) &&
    node.getText() === operationExpr
  )
}

function isReadLiteral(node: TsNode): boolean {
  return Node.isStringLiteral(node) && node.getLiteralValue() === 'read'
}

function hasReadSwitchCase({ fn, operationExpr }: RewriteArgs): boolean {
  return fn.getDescendantsOfKind(SyntaxKind.SwitchStatement).some((switchStatement) => {
    if (switchStatement.getExpression().getText() !== operationExpr) {
      return false
    }
    return switchStatement
      .getClauses()
      .some((clause) => Node.isCaseClause(clause) && isReadLiteral(clause.getExpression()))
  })
}

function referencesReadLiteral(fn: HookFunction): boolean {
  return fn
    .getDescendantsOfKind(SyntaxKind.StringLiteral)
    .some((literal) => literal.getLiteralValue() === 'read')
}

/**
 * The expanded comparison only needs wrapping where surrounding precedence
 * could change its meaning (e.g. nested inside `&&`/`||` or a `!`). Positions
 * that already delimit the expression — `if (...)`, `return ...`, a ternary
 * condition, an arrow body — are left unwrapped for cleaner output.
 */
function needsParens(node: BinaryExpression): boolean {
  const parent = node.getParent()
  if (!parent) {
    return true
  }

  return !(
    Node.isParenthesizedExpression(parent) ||
    Node.isIfStatement(parent) ||
    Node.isWhileStatement(parent) ||
    Node.isDoStatement(parent) ||
    Node.isReturnStatement(parent) ||
    Node.isConditionalExpression(parent) ||
    Node.isArrowFunction(parent) ||
    Node.isVariableDeclaration(parent) ||
    Node.isPropertyAssignment(parent)
  )
}
