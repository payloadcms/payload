import type { ImportDeclaration, SourceFile } from 'ts-morph';
import type { DetectionError, ImportCleanupResult, ImportRemovalResult, NamedImportRemovalResult } from './types.js';
export declare function findImportDeclaration({ moduleSpecifier, sourceFile, }: {
    moduleSpecifier: string;
    sourceFile: SourceFile;
}): ImportDeclaration | undefined;
type FormatErrorOptions = {
    actual: string;
    context: string;
    debugInfo?: Record<string, unknown>;
    expected: string;
    technicalDetails: string;
};
export declare function formatError(options: FormatErrorOptions): DetectionError;
export declare function addImportDeclaration({ defaultImport, insertIndex, moduleSpecifier, namedImports, sourceFile, }: {
    defaultImport?: string;
    insertIndex?: number;
    moduleSpecifier: string;
    namedImports?: string[];
    sourceFile: SourceFile;
}): SourceFile;
export declare function removeImportDeclaration({ moduleSpecifier, sourceFile, }: {
    moduleSpecifier: string;
    sourceFile: SourceFile;
}): ImportRemovalResult;
/**
 * Remove specific named imports from an import declaration
 * If all named imports are removed, removes the entire declaration
 */
export declare function removeNamedImports({ importDeclaration, namedImportsToRemove, sourceFile, }: {
    importDeclaration: ImportDeclaration;
    namedImportsToRemove: string[];
    sourceFile: SourceFile;
}): NamedImportRemovalResult;
/**
 * Check if a named import is used in the source file
 */
export declare function isNamedImportUsed(sourceFile: SourceFile, importName: string, excludeImports?: boolean): boolean;
/**
 * Clean up orphaned imports - remove imports that are no longer used
 */
export declare function cleanupOrphanedImports({ importNames, moduleSpecifier, sourceFile: inputSourceFile, }: {
    importNames: string[];
    moduleSpecifier: string;
    sourceFile: SourceFile;
}): ImportCleanupResult;
export {};
//# sourceMappingURL=utils.d.ts.map