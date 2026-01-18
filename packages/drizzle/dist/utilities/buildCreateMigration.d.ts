import type { CreateMigration } from 'payload';
export declare const buildCreateMigration: ({ executeMethod, filename, sanitizeStatements, }: {
    executeMethod: string;
    filename: string;
    sanitizeStatements: (args: {
        sqlExecute: string;
        statements: string[];
    }) => string;
}) => CreateMigration;
//# sourceMappingURL=buildCreateMigration.d.ts.map