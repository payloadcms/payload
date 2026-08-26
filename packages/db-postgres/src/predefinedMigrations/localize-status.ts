const imports = `import { migrateLocalizeStatus } from '@payloadcms/db-postgres/migration-utils'`
const upSQL = `   await migrateLocalizeStatus({
        db,
        payload,
        req,
        sql,
        })
`

export { imports, upSQL }
