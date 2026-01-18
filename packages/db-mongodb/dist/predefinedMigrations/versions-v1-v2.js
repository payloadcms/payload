const imports = `import { migrateVersionsV1_V2 } from '@payloadcms/db-mongodb/migration-utils'`;
const upSQL = `   await migrateVersionsV1_V2({
        req,
        })
`;
export { imports, upSQL };

//# sourceMappingURL=versions-v1-v2.js.map