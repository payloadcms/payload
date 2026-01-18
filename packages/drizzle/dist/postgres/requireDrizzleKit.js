import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const requireDrizzleKit = ()=>{
    const { generateDrizzleJson, generateMigration, pushSchema, upPgSnapshot } = require('drizzle-kit/api');
    return {
        generateDrizzleJson,
        generateMigration,
        pushSchema,
        upSnapshot: upPgSnapshot
    };
};

//# sourceMappingURL=requireDrizzleKit.js.map