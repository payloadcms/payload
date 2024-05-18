import type { Payload } from 'payload/types'

import { sql } from 'drizzle-orm'

import type { DrizzleTransaction } from '../../types.js'
import type { ColumnToCreate } from './types.js'

type Args = {
  columnsToCreate: ColumnToCreate[]
  db: DrizzleTransaction
  debug: boolean
  dryRun: boolean
  payload: Payload
}

export const createColumns = async ({ columnsToCreate, db, debug, dryRun, payload }: Args) => {
  let createColumnsStatement = columnsToCreate.reduce(
    (statement, { columnName, columnType, tableName }) => {
      return (statement += `
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${tableName}' AND column_name='${columnName}') THEN
  ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType};
  END IF;
      `)
    },
    '',
  )

  createColumnsStatement = `DO $$
BEGIN
${createColumnsStatement}
END $$;
`

  if (debug) {
    payload.logger.info('CREATING NEW RELATIONSHIP COLUMNS')
    payload.logger.info(createColumnsStatement)
    payload.logger.info('SUCCESSFULLY CREATED NEW RELATIONSHIP COLUMNS')
  }

  if (!dryRun) {
    await db.execute(sql.raw(`${createColumnsStatement}`))
  }
}
