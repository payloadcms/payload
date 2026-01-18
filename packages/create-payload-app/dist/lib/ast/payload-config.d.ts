import { type SourceFile } from 'ts-morph';
import type { ConfigureOptions, DatabaseAdapter, DetectionResult, StorageAdapter, TransformationResult, WriteOptions, WriteResult } from './types.js';
export declare function detectPayloadConfigStructure(sourceFile: SourceFile): DetectionResult;
export declare function addDatabaseAdapter({ adapter, envVarName, sourceFile, }: {
    adapter: DatabaseAdapter;
    envVarName?: string;
    sourceFile: SourceFile;
}): TransformationResult;
export declare function addStorageAdapter({ adapter, sourceFile, }: {
    adapter: StorageAdapter;
    sourceFile: SourceFile;
}): TransformationResult;
export declare function removeSharp(sourceFile: SourceFile): TransformationResult;
/** This shouldn't be necessary once the templates are updated. Can't hurt to keep in, though */
export declare function removeCommentMarkers(sourceFile: SourceFile): SourceFile;
/**
 * Validates payload config structure has required elements after transformation.
 * Checks that buildConfig() call exists and has a db property configured.
 */
export declare function validateStructure(sourceFile: SourceFile): WriteResult;
export declare function writeTransformedFile(sourceFile: SourceFile, options?: WriteOptions): Promise<WriteResult>;
export declare function configurePayloadConfig(filePath: string, options?: ConfigureOptions): Promise<WriteResult>;
//# sourceMappingURL=payload-config.d.ts.map