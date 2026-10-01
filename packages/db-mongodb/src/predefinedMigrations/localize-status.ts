const imports = `import { migrateLocalizeStatus } from '@payloadcms/db-mongodb/migration-utils'`
const upSQL = `   await migrateLocalizeStatus({
        payload,
        req,
        })
`

export { imports, upSQL }
