import type { GenerateSchema } from 'payload';
import type { ColumnToCodeConverter } from '../types.js';
export declare const createSchemaGenerator: ({ columnToCodeConverter, corePackageSuffix, defaultOutputFile, enumImport, schemaImport, tableImport, }: {
    columnToCodeConverter: ColumnToCodeConverter;
    corePackageSuffix: string;
    defaultOutputFile?: string;
    enumImport?: string;
    schemaImport?: string;
    tableImport: string;
}) => GenerateSchema;
//# sourceMappingURL=createSchemaGenerator.d.ts.map