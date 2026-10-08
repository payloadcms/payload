import type { Column, SQL } from 'drizzle-orm'
import type { FlattenedField, Operator } from 'payload'

import { APIError } from 'payload'

import type {
  DrizzleAdapter,
  DrizzleOperandTransformHandler,
  DrizzleOperatorHandler,
  DrizzleOperatorHandlerContext,
  DrizzleOperatorReplacementHandler,
} from '../types.js'
import type { DrizzleResolvedOperator } from './operatorMap.js'

type Args = {
  adapter: DrizzleAdapter
  column: Column | SQL
  field: FlattenedField
  locale?: string
  originalOperator: Operator
  path: string
  resolvedOperator: DrizzleResolvedOperator
  value: unknown
}

const isTransformHandler = (
  handler: DrizzleOperatorHandler,
): handler is DrizzleOperandTransformHandler => typeof handler.transformOperands === 'function'

const isReplacementHandler = (
  handler: DrizzleOperatorHandler,
): handler is DrizzleOperatorReplacementHandler => typeof handler.build === 'function'

const handlerMatches = (handler: DrizzleOperatorHandler, args: Args): boolean => {
  if (!handler.operators.includes(args.resolvedOperator)) {
    return false
  }

  if (handler.fieldTypes && !handler.fieldTypes.includes(args.field.type)) {
    return false
  }

  return true
}

/**
 * Builds the final, user-facing SQL comparison for one query leaf: applies every matching
 * operand-transform handler in configuration order, then either calls the single matching
 * replacement handler or falls back to `adapter.operators[resolvedOperator]`.
 */
export const buildOperatorConstraint = (args: Args): SQL => {
  const { adapter, field, locale, originalOperator, path, resolvedOperator } = args

  const matchingHandlers = (adapter.operatorHandlers ?? []).filter((handler) =>
    handlerMatches(handler, args),
  )

  const context: DrizzleOperatorHandlerContext = {
    adapter,
    column: args.column,
    field,
    locale,
    originalOperator,
    path,
    resolvedOperator,
    storage: 'column',
    value: args.value,
  }

  for (const handler of matchingHandlers.filter(isTransformHandler)) {
    let result: { column: Column | SQL; value: unknown }

    try {
      result = handler.transformOperands({ ...context })
    } catch (error) {
      throw new Error(
        `Operator handler "${handler.name}" threw while transforming operands for the "${resolvedOperator}" operator at path "${path}".`,
        { cause: error },
      )
    }

    if (!result || typeof result !== 'object' || !('column' in result) || !('value' in result)) {
      throw new APIError(
        `Operator handler "${handler.name}" returned an invalid operand transform for the "${resolvedOperator}" operator at path "${path}". Expected an object with "column" and "value" properties.`,
      )
    }

    context.column = result.column
    context.value = result.value
  }

  const replacementHandler = matchingHandlers.find(isReplacementHandler)

  if (replacementHandler) {
    try {
      return replacementHandler.build({ ...context })
    } catch (error) {
      throw new Error(
        `Operator handler "${replacementHandler.name}" threw while building the "${resolvedOperator}" comparison at path "${path}".`,
        { cause: error },
      )
    }
  }

  return adapter.operators[resolvedOperator](context.column, context.value)
}
