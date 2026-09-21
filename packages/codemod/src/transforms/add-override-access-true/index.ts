import type { ObjectLiteralExpression } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Local API methods that accept `overrideAccess`.
 *
 * Excludes `auth` and `verifyEmail`, which have no such option, and
 * `resetPassword`, which has no destructuring default to preserve.
 */
const LOCAL_API_OPERATIONS = new Set([
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

const JOBS_LOCAL_API_OPERATIONS = new Set(['cancel', 'cancelByID', 'queue', 'run', 'runByID'])

/**
 * Adds an explicit `overrideAccess: true` to Local API calls that omit it,
 * preserving the Payload 3 default of skipping access control now that
 * Payload 4 changes the default to `false`.
 *
 * Only matches calls on a receiver named `payload` — `payload.find(...)`,
 * `req.payload.find(...)`, and their `payload.jobs.*` equivalents. Internal
 * operations such as `findOperation(...)` are deliberately never matched: a
 * missing value means `false` there, so inserting `true` would disable access
 * control on every REST and GraphQL request.
 *
 * Detection is purely syntactic so the transform works on JavaScript projects,
 * where ts-morph has no type information to consult.
 *
 * The property is appended rather than sorted. Callers are expected to run
 * ESLint's `perfectionist/sort-objects` fixer afterwards.
 */
export const addOverrideAccessTrue: Transform = {
  name: 'add-override-access-true',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      const insertions: Insertion[] = []

      sourceFile.forEachDescendant((node) => {
        if (!Node.isCallExpression(node)) {
          return
        }

        const callee = node.getExpression()

        if (!Node.isPropertyAccessExpression(callee)) {
          return
        }

        const receiver = callee.getExpression()
        const isLocalAPICall =
          LOCAL_API_OPERATIONS.has(callee.getName()) && isPayloadReceiver({ receiver })
        const isJobsLocalAPICall =
          JOBS_LOCAL_API_OPERATIONS.has(callee.getName()) && isPayloadJobsReceiver({ receiver })

        if (!isLocalAPICall && !isJobsLocalAPICall) {
          return
        }

        const [firstArg] = node.getArguments()

        if (!firstArg && isJobsLocalAPICall) {
          const openParen = node.getFirstChildByKindOrThrow(SyntaxKind.OpenParenToken)
          insertions.push({ position: openParen.getEnd(), text: '{ overrideAccess: true }' })
          return
        }

        const object = firstArg && getObjectLiteral({ node: firstArg })

        if (!object) {
          return
        }

        if (object.getProperty('overrideAccess')) {
          return
        }

        // A spread may already carry the property. Refuse to guess.
        if (object.getProperties().some((property) => Node.isSpreadAssignment(property))) {
          return
        }

        insertions.push(planInsertion({ object }))
      })

      if (insertions.length === 0) {
        continue
      }

      // Applying back to front keeps every earlier offset valid, and means nested
      // calls are handled before the call that contains them.
      for (const { position, text } of insertions.sort((a, b) => b.position - a.position)) {
        sourceFile.insertText(position, text)
      }

      filesChanged.add(sourceFile.getFilePath())
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Add an explicit `overrideAccess: true` to Local API calls that omit it. Payload 4 changes the default to `false`; `true` preserves the Payload 3 default of skipping access control. Review each inserted value and switch to `false` wherever the operation acts on behalf of a user.',
}

type Insertion = {
  position: number
  text: string
}

/** Handles an object wrapped in the common `as SomeType` assertion. */
const getObjectLiteral = ({ node }: { node: Node }): ObjectLiteralExpression | undefined => {
  if (Node.isObjectLiteralExpression(node)) {
    return node
  }

  if (Node.isAsExpression(node)) {
    const expression = node.getExpression()

    if (Node.isObjectLiteralExpression(expression)) {
      return expression
    }
  }
}

/**
 * Works out where to put `overrideAccess: true` and what to write, without
 * asking ts-morph to insert a property node.
 *
 * ts-morph's property insertion mishandles the comma whenever the object holds a
 * comment — it emitted `req,,` for a comment sitting between two properties, and
 * a double comma for one trailing the last property. Both produce a file that no
 * longer parses, which in turn makes ESLint report nothing at all. Writing the
 * text ourselves sidesteps the whole problem.
 *
 * The property goes last so the surrounding formatting is left alone. Callers are
 * expected to run ESLint's `perfectionist/sort-objects` fixer afterwards.
 */
const planInsertion = ({ object }: { object: ObjectLiteralExpression }): Insertion => {
  const properties = object.getProperties()
  const isSingleLine = !object.getText().includes('\n')

  if (properties.length === 0) {
    const openBrace = object.getFirstChildByKindOrThrow(SyntaxKind.OpenBraceToken)

    return {
      position: openBrace.getEnd(),
      text: isSingleLine ? ' overrideAccess: true ' : `\n  overrideAccess: true,`,
    }
  }

  const lastProperty = properties[properties.length - 1]!
  const fullText = object.getSourceFile().getFullText()

  // Step past any whitespace to see whether the last property already has a
  // trailing comma. Inserting after that comma, rather than after the property,
  // is what keeps a following comment attached to the end of the object.
  let cursor = lastProperty.getEnd()

  while (cursor < fullText.length && /\s/.test(fullText[cursor]!)) {
    cursor += 1
  }

  const hasTrailingComma = fullText[cursor] === ','
  const position = hasTrailingComma ? cursor + 1 : lastProperty.getEnd()

  if (isSingleLine) {
    return {
      position,
      text: hasTrailingComma ? ' overrideAccess: true,' : ', overrideAccess: true',
    }
  }

  const indent = lastProperty.getIndentationText()

  return {
    position,
    text: hasTrailingComma
      ? `\n${indent}overrideAccess: true,`
      : `,\n${indent}overrideAccess: true,`,
  }
}

/**
 * True when the receiver of a call is a Payload instance, recognised
 * syntactically as an identifier named `payload` or any property access ending
 * in `.payload`.
 */
const isPayloadReceiver = ({ receiver }: { receiver: Node }): boolean => {
  if (Node.isIdentifier(receiver)) {
    return receiver.getText() === 'payload'
  }

  if (Node.isPropertyAccessExpression(receiver)) {
    return receiver.getName() === 'payload'
  }

  return false
}

/** True for `payload.jobs` and property-access chains ending in `.payload.jobs`. */
const isPayloadJobsReceiver = ({ receiver }: { receiver: Node }): boolean => {
  if (!Node.isPropertyAccessExpression(receiver) || receiver.getName() !== 'jobs') {
    return false
  }

  return isPayloadReceiver({ receiver: receiver.getExpression() })
}
