import type { PayloadComponent, SanitizedConfig } from '../../config/types.js';
type ImportIdentifier = string;
type ImportSpecifier = string;
type ImportPath = string;
type UserImportPath = string;
/**
 * Import Map before being written to the file. Only contains all paths
 */
export type InternalImportMap = {
    [path: UserImportPath]: ImportIdentifier;
};
/**
 * Imports of the import map.
 */
export type Imports = {
    [identifier: ImportIdentifier]: {
        path: ImportPath;
        specifier: ImportSpecifier;
    };
};
/**
 * Import Map after being imported from the actual import map. Contains all the actual imported components
 */
export type ImportMap = {
    [path: UserImportPath]: any;
};
export type AddToImportMap = (payloadComponent?: PayloadComponent | PayloadComponent[]) => void;
export declare function generateImportMap(config: SanitizedConfig, options?: {
    force?: boolean; /**
     * If true, will not throw an error if the import map file path cannot be resolved
    Instead, it will return silently.
     */
    ignoreResolveError?: boolean;
    log: boolean;
}): Promise<void>;
export declare function writeImportMap({ componentMap, force, importMap, importMapFilePath, log, }: {
    componentMap: InternalImportMap;
    force?: boolean;
    importMap: Imports;
    importMapFilePath: string;
    log?: boolean;
}): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map