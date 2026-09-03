import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'

type DynamicImportOptions = {
  /** Resolve package specifiers from this module URL instead of from Payload. */
  from?: string
}

/**
 * Dynamically imports a module from a file path or module specifier.
 *
 * Uses a direct `import()` in Vitest (where eval'd imports fail with ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING),
 * and `eval(`import(...)`)` elsewhere to hide the import from Next.js bundler static analysis.
 *
 * @param modulePathOrSpecifier - Either an absolute file path or a module specifier (package name)
 * @param options - Optional caller information used to resolve package specifiers
 */
export async function dynamicImport<T = unknown>(
  modulePathOrSpecifier: string,
  options?: DynamicImportOptions,
): Promise<T> {
  const resolvedPathOrSpecifier = options?.from
    ? createRequire(options.from).resolve(modulePathOrSpecifier)
    : modulePathOrSpecifier

  // Convert absolute file paths to file:// URLs, but leave package specifiers as-is
  const importPath = path.isAbsolute(resolvedPathOrSpecifier)
    ? pathToFileURL(resolvedPathOrSpecifier).href
    : resolvedPathOrSpecifier

  // Vitest runs tests in a VM context where eval'd dynamic imports fail with
  // ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING. Use direct import in test environment.
  if (process.env.VITEST) {
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ importPath)
  }

  // Without the eval, the Next.js bundler will throw this error when encountering the import statement:
  // ⚠ Compiled with warnings in X.Xs
  // Critical dependency: the request of a dependency is an expression
  return await eval(`import('${importPath}')`)
}
