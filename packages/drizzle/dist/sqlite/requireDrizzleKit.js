import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const requireDrizzleKit = ()=>{
    const { generateSQLiteDrizzleJson, generateSQLiteMigration, pushSQLiteSchema } = require('drizzle-kit/api');
    return {
        generateDrizzleJson: generateSQLiteDrizzleJson,
        generateMigration: generateSQLiteMigration,
        pushSchema: pushSQLiteSchema
    };
};

//# sourceMappingURL=requireDrizzleKit.js.map