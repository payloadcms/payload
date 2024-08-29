const imports = `import { migratePostgresV2toV3 } from '@payloadcms/migratePostgresV2toV3'`
const up = `   await migratePostgresV2toV3({
        // enables logging of changes that will be made to the database
        debug: false,
        // skips calls that modify schema or data
        dryRun: false,
        payload,
        req,
        })
`
export { imports, up }

//# sourceMappingURL=relationships-v2-v3.js.map
