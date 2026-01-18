declare const imports = "import { migratePostgresV2toV3 } from '@payloadcms/db-postgres/migration-utils'";
declare const upSQL = "   await migratePostgresV2toV3({\n        // enables logging of changes that will be made to the database\n        debug: false,\n        payload,\n        req,\n        })\n";
export { imports, upSQL };
//# sourceMappingURL=relationships-v2-v3.d.ts.map