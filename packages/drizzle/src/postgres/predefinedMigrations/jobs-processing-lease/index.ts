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

export async function migratePostgresJobsProcessingLease({
  db,
  direction,
  newIndexName,
  oldIndexName,
  schemaName = 'public',
  sql,
  tableName,
}: Args): Promise<void> {
  const qualifiedTableName = `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`
  const run = (statement: string) => db.execute(sql.raw(statement))

  if (direction === 'up') {
    await run(
      `ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_until" timestamp(3) with time zone`,
    )
    await run(`ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_token" varchar`)
    await run(
      `UPDATE ${qualifiedTableName} SET "processing_until" = '1970-01-01 00:00:00+00' WHERE "processing" = true`,
    )
    await run(
      `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(oldIndexName)}`,
    )
    await run(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing"`)
    await run(
      `CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${qualifiedTableName} USING btree ("processing_until")`,
    )

    return
  }

  await run(`ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing" boolean DEFAULT false`)
  await run(
    `UPDATE ${qualifiedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`,
  )
  await run(`DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(newIndexName)}`)
  await run(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_token"`)
  await run(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_until"`)
  await run(
    `CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${qualifiedTableName} USING btree ("processing")`,
  )
}
