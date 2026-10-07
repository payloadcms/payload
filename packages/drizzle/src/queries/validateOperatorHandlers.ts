import { APIError } from 'payload'

import type { DrizzleOperatorHandler, DrizzleOperatorReplacementHandler } from '../types.js'

const isReplacementHandler = (
  handler: DrizzleOperatorHandler,
): handler is DrizzleOperatorReplacementHandler => typeof handler.build === 'function'

const fieldTypesOverlap = (
  a: DrizzleOperatorReplacementHandler,
  b: DrizzleOperatorReplacementHandler,
): boolean =>
  !a.fieldTypes ||
  !b.fieldTypes ||
  a.fieldTypes.some((fieldType) => b.fieldTypes.includes(fieldType))

/**
 * Validates operator-handler configuration before any request runs: rejects a handler that
 * defines both `build` and `transformOperands`, and rejects two replacement handlers whose
 * `operators` and `fieldTypes` both overlap for the same resolved operator.
 */
export const validateOperatorHandlers = (operatorHandlers: DrizzleOperatorHandler[]): void => {
  for (const handler of operatorHandlers) {
    if (typeof handler.build === 'function' && typeof handler.transformOperands === 'function') {
      throw new APIError(
        `Operator handler "${handler.name}" cannot define both "build" and "transformOperands". Use "transformOperands" to adjust operands, or "build" to replace the comparison entirely.`,
      )
    }
  }

  const replacementHandlers = operatorHandlers.filter(isReplacementHandler)

  for (let i = 0; i < replacementHandlers.length; i++) {
    for (let j = i + 1; j < replacementHandlers.length; j++) {
      const handlerA = replacementHandlers[i]
      const handlerB = replacementHandlers[j]

      const sharedOperators = handlerA.operators.filter((operator) =>
        handlerB.operators.includes(operator),
      )

      if (!sharedOperators.length) {
        continue
      }

      if (fieldTypesOverlap(handlerA, handlerB)) {
        throw new APIError(
          `Operator handlers "${handlerA.name}" and "${handlerB.name}" both replace the "${sharedOperators.join('", "')}" operator for overlapping field types. Only one replacement handler may match a given resolved operator and field type.`,
        )
      }
    }
  }
}
