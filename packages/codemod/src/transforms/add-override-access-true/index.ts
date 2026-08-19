import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Local API methods that accept `overrideAccess`.
 *
 * Excludes `auth` and `verifyEmail`, which have no such option, and
 * `resetPassword`, which already declares it required.
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

/**
 * Adds an explicit `overrideAccess: true` to Local API calls that omit it,
 * preserving the Payload 3 default of skipping access control.
 *
 * Only matches calls on a receiver named `payload` — `payload.find(...)` and
 * `req.payload.find(...)`. Internal operations such as `findOperation(...)` are
 * deliberately never matched: a missing value means `false` there, so inserting
 * `true` would disable access control on every REST and GraphQL request.
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
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isCallExpression(node)) {
          return
        }

        const callee = node.getExpression()

        if (!Node.isPropertyAccessExpression(callee)) {
          return
        }

        if (!LOCAL_API_OPERATIONS.has(callee.getName())) {
          return
        }

        if (!isPayloadReceiver(callee.getExpression())) {
          return
        }

        const [firstArg] = node.getArguments()

        if (!firstArg || !Node.isObjectLiteralExpression(firstArg)) {
          return
        }

        if (firstArg.getProperty('overrideAccess')) {
          return
        }

        // A spread may already carry the property. Refuse to guess.
        if (firstArg.getProperties().some((property) => Node.isSpreadAssignment(property))) {
          return
        }

        // `addPropertyAssignment` emits a double comma when the object ends with a
        // trailing comment. Inserting at the property count avoids that, and keeps
        // the comment attached to the end of the object.
        firstArg.insertPropertyAssignment(firstArg.getProperties().length, {
          name: 'overrideAccess',
          initializer: 'true',
        })
        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Add an explicit `overrideAccess: true` to Local API calls that omit it. Payload 4 requires the property; `true` preserves the Payload 3 default of skipping access control. Review each inserted value and switch to `false` wherever the operation acts on behalf of a user.',
}

/**
 * True when the receiver of a call is a Payload instance, recognised
 * syntactically as an identifier named `payload` or any property access ending
 * in `.payload`.
 */
const isPayloadReceiver = (receiver: Node): boolean => {
  if (Node.isIdentifier(receiver)) {
    return receiver.getText() === 'payload'
  }

  if (Node.isPropertyAccessExpression(receiver)) {
    return receiver.getName() === 'payload'
  }

  return false
}
