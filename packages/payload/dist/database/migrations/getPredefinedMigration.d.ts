import type { Payload } from '../../index.js';
import type { MigrationTemplateArgs } from '../types.js';
/**
 * Get predefined migration 'up', 'down' and 'imports'.
 *
 * Supports two import methods:
 * 1. @payloadcms/db-* packages: Loads from adapter's predefinedMigrations folder directly (no package.json export needed)
 *    Example: `--file @payloadcms/db-mongodb/relationships-v2-v3`
 * 2. Any other package/path: Uses dynamic import via package.json exports or absolute file paths
 *    Example: `--file @payloadcms/plugin-seo/someMigration` or `--file /absolute/path/to/migration.ts`
 */
export declare const getPredefinedMigration: ({ dirname, file, migrationName: migrationNameArg, payload, }: {
    dirname: string;
    file?: string;
    migrationName?: string;
    payload: Payload;
}) => Promise<MigrationTemplateArgs>;
//# sourceMappingURL=getPredefinedMigration.d.ts.map