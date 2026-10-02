const imports = `import { migrateBranching } from '@payloadcms/db-mongodb/migration-utils'`
const upSQL = `  await migrateBranching({
    payload,
    session,
  })
`

export { imports, upSQL }
