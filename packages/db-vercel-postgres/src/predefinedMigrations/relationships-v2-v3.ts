const imports = `import { migratePostgresV2toV3 } from '@payloadcms/db-postgres/migration-utils'`
const upSQL = `   await migratePostgresV2toV3({
        // enables logging of changes that will be made to the database
        debug: false,
        payload,
        req,
        })
`

export { imports, upSQL }
