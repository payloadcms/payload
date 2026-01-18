const imports = `import { migrateRelationshipsV2_V3 } from '@ruya.sa/db-mongodb/migration-utils'`
const upSQL = `   await migrateRelationshipsV2_V3({
        batchSize: 100,
        req,
        })
`
export { imports, upSQL }
