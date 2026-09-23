import { sql } from 'drizzle-orm'
import { APIError } from 'payload'

import type { PostgresDB } from '../../types.js'
import type { PostgresOperatorHandler } from '../types.js'

type Args = {
  drizzle: PostgresDB
  operatorHandlers: PostgresOperatorHandler[]
}

/**
 * Confirms every Postgres extension named in an operator handler's `requiredExtensions` is
 * installed in the connected database. Runs once per connect, after `createExtensions` has had a
 * chance to install any extension declared in the adapter's `extensions` option - an extension
 * that was installed by hand, without ever being declared there, still satisfies this check.
 */
export const assertOperatorHandlerExtensionsInstalled = async ({
  drizzle,
  operatorHandlers,
}: Args): Promise<void> => {
  const requiredExtensionsByHandler = operatorHandlers.flatMap((handler) =>
    (handler.requiredExtensions ?? []).map((extensionName) => ({ extensionName, handler })),
  )

  if (!requiredExtensionsByHandler.length) {
    return
  }

  const { rows: installedExtensionRows } = await drizzle.execute<{ extname: string }>(
    sql`SELECT extname FROM pg_extension`,
  )
  const installedExtensions = new Set(installedExtensionRows.map((row) => row.extname))

  for (const { extensionName, handler } of requiredExtensionsByHandler) {
    if (!installedExtensions.has(extensionName)) {
      throw new APIError(
        `Operator handler "${handler.name}" requires the "${extensionName}" Postgres extension, which is not installed on this database. Add it to the adapter's "extensions" option, or install it manually with CREATE EXTENSION.`,
      )
    }
  }
}
