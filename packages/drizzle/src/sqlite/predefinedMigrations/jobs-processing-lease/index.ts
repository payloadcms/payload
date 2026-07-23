type Args = {
  db: any
  direction: 'down' | 'up'
  newIndexName: string
  oldIndexName: string
  schemaName?: string
  sql: any
  tableName: string
}

const quoteIdentifier = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`

export async function migrateSqliteJobsProcessingLease({
  db,
  direction,
  newIndexName,
  oldIndexName,
  sql,
  tableName,
}: Args): Promise<void> {
  const quotedTableName = quoteIdentifier(tableName)
  const run = (statement: string) => db.run(sql.raw(statement))

  if (direction === 'up') {
    await run(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing_until" text`)
    await run(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing_token" text`)
    await run(
      `UPDATE ${quotedTableName} SET "processing_until" = '1970-01-01T00:00:00.000Z' WHERE "processing" = true`,
    )
    await run(`DROP INDEX IF EXISTS ${quoteIdentifier(oldIndexName)}`)
    await run(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing"`)
    await run(
      `CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${quotedTableName} ("processing_until")`,
    )

    return
  }

  await run(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing" integer DEFAULT false`)
  await run(
    `UPDATE ${quotedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`,
  )
  await run(`DROP INDEX IF EXISTS ${quoteIdentifier(newIndexName)}`)
  await run(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing_token"`)
  await run(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing_until"`)
  await run(`CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${quotedTableName} ("processing")`)
}
