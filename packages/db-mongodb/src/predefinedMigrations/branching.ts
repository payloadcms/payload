const imports = `import { migrateBranching } from '@payloadcms/db-mongodb/migration-utils'`
const upSQL = `  // Index synchronization must run outside the migration transaction.
  await migrateBranching({
    payload,
  })
`

export { imports, upSQL }
