import fs from 'fs';
import path from 'path';
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
 */ export const findMigrationDir = (migrationDir)=>{
    const cwd = process.cwd();
    const srcMigrationsDir = path.resolve(cwd, 'src/migrations');
    const distMigrationsDir = path.resolve(cwd, 'dist/migrations');
    const relativeMigrations = path.resolve(cwd, 'migrations');
    // Use arg if provided
    if (migrationDir) {
        return migrationDir;
    }
    // Check other common locations
    if (fs.existsSync(srcMigrationsDir)) {
        return srcMigrationsDir;
    }
    if (fs.existsSync(distMigrationsDir)) {
        return distMigrationsDir;
    }
    if (fs.existsSync(relativeMigrations)) {
        return relativeMigrations;
    }
    if (fs.existsSync(path.resolve(cwd, 'src'))) {
        return srcMigrationsDir;
    }
    return relativeMigrations;
};

//# sourceMappingURL=findMigrationDir.js.map