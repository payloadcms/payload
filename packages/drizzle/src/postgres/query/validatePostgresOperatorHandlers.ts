import { APIError } from 'payload'

import type { PostgresOperatorHandler } from '../types.js'

import { validateOperatorHandlers } from '../../queries/validateOperatorHandlers.js'

type Args = {
  extensions: Record<string, boolean>
  operatorHandlers: PostgresOperatorHandler[]
}

/**
 * Validates Postgres operator-handler configuration before any request runs: delegates the
 * generic replacement-conflict and malformed-handler checks to `validateOperatorHandlers`, then
 * rejects any handler whose `requiredExtensions` are not present in the adapter's `extensions`.
 */
export const validatePostgresOperatorHandlers = ({ extensions, operatorHandlers }: Args): void => {
  validateOperatorHandlers(operatorHandlers)

  for (const handler of operatorHandlers) {
    for (const requiredExtension of handler.requiredExtensions ?? []) {
      if (!extensions[requiredExtension]) {
        throw new APIError(
          `Operator handler "${handler.name}" requires the "${requiredExtension}" Postgres extension. Add it to the adapter's "extensions" option.`,
        )
      }
    }
  }
}
