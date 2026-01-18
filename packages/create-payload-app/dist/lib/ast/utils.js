import { debug } from '../../utils/log.js';
export function findImportDeclaration({ moduleSpecifier, sourceFile }) {
    return sourceFile.getImportDeclarations().find((imp)=>imp.getModuleSpecifierValue() === moduleSpecifier);
}
export function formatError(options) {
    const { actual, context, debugInfo, expected, technicalDetails } = options;
    const userMessage = `Your config file doesn't match the expected structure for ${context}.

Expected: ${expected}
Actual: ${actual}

Please ensure your config file follows the expected structure.`;
    return {
        technicalDetails,
        userMessage,
        ...debugInfo && {
            debugInfo
        }
    };
}
export function addImportDeclaration({ defaultImport, insertIndex, moduleSpecifier, namedImports, sourceFile }) {
    const existingImport = findImportDeclaration({
        moduleSpecifier,
        sourceFile
    });
    if (existingImport) {
        // Add named imports to existing import if they don't exist
        if (namedImports) {
            const existingNamedImports = existingImport.getNamedImports().map((ni)=>ni.getName());
            const newNamedImports = namedImports.filter((ni)=>!existingNamedImports.includes(ni));
            if (newNamedImports.length > 0) {
                existingImport.addNamedImports(newNamedImports);
                debug(`[AST] Added named imports to existing import from '${moduleSpecifier}': ${newNamedImports.join(', ')}`);
            } else {
                debug(`[AST] Import from '${moduleSpecifier}' already has all required named imports`);
            }
        }
    } else {
        // Create new import at specified index or at default position
        const importDeclaration = {
            moduleSpecifier,
            ...namedImports && {
                namedImports
            },
            ...defaultImport && {
                defaultImport
            }
        };
        if (insertIndex !== undefined) {
            sourceFile.insertImportDeclaration(insertIndex, importDeclaration);
            debug(`[AST] Inserted import from '${moduleSpecifier}' at index ${insertIndex}`);
        } else {
            sourceFile.addImportDeclaration(importDeclaration);
            debug(`[AST] Added import from '${moduleSpecifier}' at default position`);
        }
        const parts = [];
        if (defaultImport) {
            parts.push(`default: ${defaultImport}`);
        }
        if (namedImports) {
            parts.push(`named: ${namedImports.join(', ')}`);
        }
        debug(`[AST] Import contents: ${parts.join(', ')}`);
    }
    return sourceFile;
}
export function removeImportDeclaration({ moduleSpecifier, sourceFile }) {
    const importDecl = findImportDeclaration({
        moduleSpecifier,
        sourceFile
    });
    if (importDecl) {
        // Get index before removing
        const allImports = sourceFile.getImportDeclarations();
        const index = allImports.indexOf(importDecl);
        importDecl.remove();
        debug(`[AST] Removed import from '${moduleSpecifier}' at index ${index}`);
        return {
            removedIndex: index,
            sourceFile
        };
    } else {
        debug(`[AST] Import from '${moduleSpecifier}' not found (already absent)`);
        return {
            removedIndex: undefined,
            sourceFile
        };
    }
}
/**
 * Remove specific named imports from an import declaration
 * If all named imports are removed, removes the entire declaration
 */ export function removeNamedImports({ importDeclaration, namedImportsToRemove, sourceFile }) {
    const namedImports = importDeclaration.getNamedImports();
    const remainingImports = namedImports.filter((ni)=>!namedImportsToRemove.includes(ni.getName()));
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    debug(`[AST] Removing named imports [${namedImportsToRemove.join(', ')}] from '${moduleSpecifier}'`);
    debug(`[AST] Remaining imports: ${remainingImports.length}`);
    if (remainingImports.length === 0 && !importDeclaration.getDefaultImport()) {
        // No imports left, remove entire declaration
        const allImports = sourceFile.getImportDeclarations();
        const index = allImports.indexOf(importDeclaration);
        importDeclaration.remove();
        debug(`[AST] ✓ Removed entire import from '${moduleSpecifier}' (no remaining imports)`);
        return {
            fullyRemoved: true,
            index,
            sourceFile
        };
    } else {
        // Remove specific named imports
        namedImports.forEach((ni)=>{
            if (namedImportsToRemove.includes(ni.getName())) {
                ni.remove();
            }
        });
        debug(`[AST] ✓ Removed named imports, kept ${remainingImports.length} import(s) from '${moduleSpecifier}'`);
        return {
            fullyRemoved: false,
            sourceFile
        };
    }
}
/**
 * Check if a named import is used in the source file
 */ export function isNamedImportUsed(sourceFile, importName, excludeImports = true) {
    const fullText = sourceFile.getFullText();
    if (excludeImports) {
        // Remove import declarations from consideration
        const imports = sourceFile.getImportDeclarations();
        let textWithoutImports = fullText;
        imports.forEach((imp)=>{
            const importText = imp.getFullText();
            textWithoutImports = textWithoutImports.replace(importText, '');
        });
        // Check if import name appears in code (not in imports)
        // Use word boundary to avoid partial matches
        const regex = new RegExp(`\\b${importName}\\b`);
        return regex.test(textWithoutImports);
    }
    // Simple check including imports
    const regex = new RegExp(`\\b${importName}\\b`);
    return regex.test(fullText);
}
/**
 * Clean up orphaned imports - remove imports that are no longer used
 */ export function cleanupOrphanedImports({ importNames, moduleSpecifier, sourceFile: inputSourceFile }) {
    let sourceFile = inputSourceFile;
    const importDecl = findImportDeclaration({
        moduleSpecifier,
        sourceFile
    });
    if (!importDecl) {
        debug(`[AST] No import found from '${moduleSpecifier}' to clean up`);
        return {
            kept: [],
            removed: [],
            sourceFile
        };
    }
    const removed = [];
    const kept = [];
    for (const importName of importNames){
        const isUsed = isNamedImportUsed(sourceFile, importName);
        if (!isUsed) {
            removed.push(importName);
            debug(`[AST] Import '${importName}' from '${moduleSpecifier}' is orphaned (not used)`);
        } else {
            kept.push(importName);
            debug(`[AST] Import '${importName}' from '${moduleSpecifier}' is still used`);
        }
    }
    if (removed.length > 0) {
        ;
        ({ sourceFile } = removeNamedImports({
            importDeclaration: importDecl,
            namedImportsToRemove: removed,
            sourceFile
        }));
        debug(`[AST] ✓ Cleaned up ${removed.length} orphaned import(s) from '${moduleSpecifier}'`);
    }
    return {
        kept,
        removed,
        sourceFile
    };
}

//# sourceMappingURL=utils.js.map