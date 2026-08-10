const imports = `import { migrateLocalizeStatus } from '@payloadcms/db-sqlite/migration-utils'`
const upSQL = `   await migrateLocalizeStatus({
        db,
        payload,
        req,
        })
`

export { imports, upSQL }
