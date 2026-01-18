declare const imports = "import { migrateRelationshipsV2_V3 } from '@payloadcms/db-mongodb/migration-utils'";
declare const upSQL = "   await migrateRelationshipsV2_V3({\n        batchSize: 100,\n        req,\n        })\n";
export { imports, upSQL };
//# sourceMappingURL=relationships-v2-v3.d.ts.map