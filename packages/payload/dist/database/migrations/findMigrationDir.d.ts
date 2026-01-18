/**
 * Attempt to find migrations directory.
 *
 * Checks for the following directories in order:
 * - `migrationDir` argument from Payload config
 * - `src/migrations`
 * - `dist/migrations`
 * - `migrations`
 *
 * @param migrationDir
 * @default src/migrations`, if the src folder does not exists - migrations.
 * @returns
 */
export declare const findMigrationDir: (migrationDir?: string) => string;
//# sourceMappingURL=findMigrationDir.d.ts.map