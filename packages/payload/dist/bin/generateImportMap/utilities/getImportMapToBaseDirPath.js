import path from 'path';
/**
 * Returns the path that navigates from the import map file to the base directory.
 * This can then be prepended to relative paths in the import map to get the full, absolute path.
 */ export function getImportMapToBaseDirPath({ baseDir, importMapPath }) {
    const importMapDir = path.dirname(importMapPath);
    // 1. Direct relative path from `importMapDir` -> `baseDir`
    let relativePath = path.relative(importMapDir, baseDir).replace(/\\/g, '/');
    // 2. If they're the same directory, path.relative will be "", so use "./"
    if (!relativePath) {
        relativePath = './';
    } else if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
        relativePath = `./${relativePath}`;
    }
    // 3. For consistency ensure a trailing slash
    if (!relativePath.endsWith('/')) {
        relativePath += '/';
    }
    return relativePath;
}

//# sourceMappingURL=getImportMapToBaseDirPath.js.map