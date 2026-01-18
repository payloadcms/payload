/**
 * Dynamically imports a module from a file path or module specifier.
 *
 * Uses a direct `import()` in Vitest (where eval'd imports fail with ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING),
 * and `eval(`import(...)`)` elsewhere to hide the import from Next.js bundler static analysis.
 *
 * @param modulePathOrSpecifier - Either an absolute file path or a module specifier (package name)
 */
export declare function dynamicImport<T = unknown>(modulePathOrSpecifier: string): Promise<T>;
//# sourceMappingURL=dynamicImport.d.ts.map