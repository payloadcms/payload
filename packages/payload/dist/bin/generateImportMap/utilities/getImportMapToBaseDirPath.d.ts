/**
 * Returns the path that navigates from the import map file to the base directory.
 * This can then be prepended to relative paths in the import map to get the full, absolute path.
 */
export declare function getImportMapToBaseDirPath({ baseDir, importMapPath, }: {
    /**
     * Absolute path to the base directory
     */
    baseDir: string;
    /**
     * Absolute path to the import map file
     */
    importMapPath: string;
}): string;
//# sourceMappingURL=getImportMapToBaseDirPath.d.ts.map