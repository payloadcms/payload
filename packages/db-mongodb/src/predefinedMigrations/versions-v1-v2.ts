const imports = `import { migrateVersionsV1_V2 } from '@ruya.sa/db-mongodb/migration-utils'`
const upSQL = `   await migrateVersionsV1_V2({
        req,
        })
`
export { imports, upSQL }
