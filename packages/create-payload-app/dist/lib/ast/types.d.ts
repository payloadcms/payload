import type { ArrayLiteralExpression, CallExpression, ImportDeclaration, PropertyAssignment, SourceFile } from 'ts-morph';
export type ImportRemovalResult = {
    removedIndex?: number;
    sourceFile: SourceFile;
};
export type NamedImportRemovalResult = {
    fullyRemoved: boolean;
    index?: number;
    sourceFile: SourceFile;
};
export type ImportCleanupResult = {
    kept: string[];
    removed: string[];
    sourceFile: SourceFile;
};
export type DetectionError = {
    debugInfo?: Record<string, unknown>;
    technicalDetails: string;
    userMessage: string;
};
export type PayloadConfigStructures = {
    buildConfigCall: CallExpression;
    dbProperty?: PropertyAssignment;
    importStatements: ImportDeclaration[];
    pluginsArray?: ArrayLiteralExpression;
};
/**
 * Detection result with edge case tracking and import source information
 */
export type DetectionResult = {
    /** Edge case flags */
    edgeCases?: {
        /** Import uses an alias (e.g., import { buildConfig as bc }) */
        hasImportAlias: boolean;
        /** Other Payload imports exist (e.g., CollectionConfig) */
        hasOtherPayloadImports: boolean;
        /** Multiple buildConfig calls found in file */
        multipleBuildConfigCalls: boolean;
        /** Needs manual intervention (can't be automatically handled) */
        needsManualIntervention: boolean;
    };
    error?: DetectionError;
    /** Import source tracking */
    importSources?: {
        /** Current database adapter import info */
        dbAdapter?: {
            hasOtherImports: boolean;
            importDeclaration: ImportDeclaration;
            packageName: string;
        };
        /** Current storage adapter import info */
        storageAdapters?: Array<{
            hasOtherImports: boolean;
            importDeclaration: ImportDeclaration;
            packageName: string;
        }>;
    };
    /** Source file reference */
    sourceFile?: SourceFile;
    /** Detected structures */
    structures?: PayloadConfigStructures;
    success: boolean;
};
/**
 * Tracks a single modification made to the AST
 */
export type Modification = {
    description: string;
    location?: {
        column: number;
        line: number;
    };
    type: 'function-renamed' | 'import-added' | 'import-modified' | 'import-removed' | 'property-added' | 'property-removed';
};
/**
 * Result of transformation operations
 */
export type TransformationResult = {
    error?: DetectionError;
    modifications: Modification[];
    modified: boolean;
    success: boolean;
    warnings?: string[];
};
/**
 * Final result after writing to disk
 */
export type ModificationResult = {
    error?: DetectionError;
    filePath: string;
    formatted?: boolean;
    modifications: Modification[];
    success: boolean;
    warnings?: string[];
};
export type DatabaseAdapter = (typeof ALL_DATABASE_ADAPTERS)[number];
export declare const ALL_DATABASE_ADAPTERS: readonly ["mongodb", "postgres", "sqlite", "vercel-postgres", "d1-sqlite"];
export declare const ALL_STORAGE_ADAPTERS: readonly ["azureStorage", "gcsStorage", "localDisk", "r2Storage", "s3Storage", "uploadthingStorage", "vercelBlobStorage"];
export type StorageAdapter = (typeof ALL_STORAGE_ADAPTERS)[number];
export type TransformOptions = {
    databaseAdapter?: {
        envVarName?: string;
        type: DatabaseAdapter;
    };
    removeSharp?: boolean;
    storageAdapter?: {
        type: StorageAdapter;
    };
};
export type WriteOptions = {
    formatWithPrettier?: boolean;
    validateStructure?: boolean;
};
export type WriteResult = {
    error?: DetectionError;
    success: boolean;
};
export type ConfigureOptions = {
    db?: {
        envVarName?: string;
        type: DatabaseAdapter;
    };
    removeSharp?: boolean;
    storage?: StorageAdapter;
} & WriteOptions;
//# sourceMappingURL=types.d.ts.map