/* eslint-disable no-console */
import fs from 'fs/promises'
import process from 'node:process'

import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'

import { iterateConfig } from './iterateConfig.js'
import { addPayloadComponentToImportMap } from './utilities/addPayloadComponentToImportMap.js'
import { getImportMapToBaseDirPath } from './utilities/getImportMapToBaseDirPath.js'
import { resolveImportMapFilePath } from './utilities/resolveImportMapFilePath.js'

type ImportIdentifier = string
type ImportSpecifier = string
type ImportPath = string
type UserImportPath = string

/**
 * Import Map before being written to the file. Only contains all paths
 */
export type InternalImportMap = {
  [path: UserImportPath]: ImportIdentifier
}

/**
 * Imports of the import map.
 */
export type Imports = {
  [identifier: ImportIdentifier]: {
    path: ImportPath
    specifier: ImportSpecifier
  }
}

/**
 * Import Map after being imported from the actual import map. Contains all the actual imported components
 */
export type ImportMap = {
  [path: UserImportPath]: any
}

/**
 * `kind` controls whether the ref is also tracked in the client-only map that gets
 * emitted to `importMap.client.js`. Default: `'server'` (server-only). Pass `'client'`
 * for refs that must be resolvable inside the React client bundle (e.g. field
 * components, `admin.condition` / `admin.validate` path strings).
 */
export type AddToImportMap = (
  payloadComponent?: PayloadComponent | PayloadComponent[],
  options?: { kind?: 'client' | 'server' },
) => void

export async function generateImportMap(
  config: SanitizedConfig,
  options?: {
    force?: boolean /**
     * If true, will not throw an error if the import map file path cannot be resolved
    Instead, it will return silently.
     */
    ignoreResolveError?: boolean
    log: boolean
  },
): Promise<void> {
  const shouldLog = options?.log ?? true

  if (shouldLog) {
    console.log('Generating import map')
  }

  const importMap: InternalImportMap = {}
  const imports: Imports = {}
  // Subset of `importMap` containing only refs marked client-bundleable. Emitted to a
  // sibling `importMap.client.js` file with a `'use client'` directive so the values
  // can cross the RSC boundary as serializable client references.
  const clientImportMap: InternalImportMap = {}
  const clientImports: Imports = {}

  // Determine the root directory of the project - usually the directory where the src or app folder is located
  const rootDir = process.env.ROOT_DIR ?? process.cwd()

  const baseDir = config.admin.importMap.baseDir ?? process.cwd()

  const importMapFilePath = await resolveImportMapFilePath({
    adminRoute: config.routes.admin,
    importMapFile: config?.admin?.importMap?.importMapFile,
    rootDir,
  })

  if (importMapFilePath instanceof Error) {
    if (options?.ignoreResolveError) {
      return
    } else {
      throw importMapFilePath
    }
  }

  const importMapToBaseDirPath = getImportMapToBaseDirPath({
    baseDir,
    importMapPath: importMapFilePath,
  })

  const addToImportMap: AddToImportMap = (payloadComponent, options) => {
    if (!payloadComponent) {
      return
    }

    if (typeof payloadComponent !== 'object' && typeof payloadComponent !== 'string') {
      console.error(payloadComponent)
      throw new Error('addToImportMap > Payload component must be an object or a string')
    }

    const clientBundleable = options?.kind === 'client'

    if (Array.isArray(payloadComponent)) {
      for (const component of payloadComponent) {
        addPayloadComponentToImportMap({
          clientBundleable,
          clientImportMap,
          clientImports,
          importMap,
          importMapToBaseDirPath,
          imports,
          payloadComponent: component,
        })
      }
    } else {
      addPayloadComponentToImportMap({
        clientBundleable,
        clientImportMap,
        clientImports,
        importMap,
        importMapToBaseDirPath,
        imports,
        payloadComponent,
      })
    }
  }

  iterateConfig({
    addToImportMap,
    baseDir: config.admin.importMap.baseDir,
    config,
    importMap,
    imports,
  })

  await writeImportMap({
    componentMap: importMap,
    force: options?.force,
    importMap: imports,
    importMapFilePath,
    log: shouldLog,
  })

  // Emit the sibling `importMap.client.js` artifact. Same on-disk shape as
  // `importMap.js`, but prefixed with `'use client'` so Next.js treats every export as
  // a client reference. This is the file that gets passed across the RSC boundary into
  // `<RootProvider>`/`<ConfigProvider>` to hydrate the in-tree ClientImportRegistry.
  await writeImportMap({
    componentMap: clientImportMap,
    force: options?.force,
    importMap: clientImports,
    importMapFilePath: getClientImportMapFilePath(importMapFilePath),
    log: shouldLog,
    useClientDirective: true,
  })
}

/**
 * Given the path to `importMap.js`, returns the sibling `importMap.client.js` path.
 * Used to colocate both artifacts in the same `app/(payload)/admin/` directory.
 */
function getClientImportMapFilePath(serverImportMapFilePath: string): string {
  const dotJsSuffix = /\.js$/i
  if (dotJsSuffix.test(serverImportMapFilePath)) {
    return serverImportMapFilePath.replace(dotJsSuffix, '.client.js')
  }
  return serverImportMapFilePath + '.client.js'
}

export async function writeImportMap({
  componentMap,
  force,
  importMap,
  importMapFilePath,
  log,
  useClientDirective,
}: {
  componentMap: InternalImportMap
  force?: boolean
  importMap: Imports
  importMapFilePath: string
  log?: boolean
  /**
   * When true, prepends a `'use client'` directive so Next.js treats every export as
   * a client reference. Used for the sibling `importMap.client.js` artifact.
   */
  useClientDirective?: boolean
}) {
  const imports: string[] = []
  for (const [identifier, { path, specifier }] of Object.entries(importMap)) {
    imports.push(`import { ${specifier} as ${identifier} } from '${path}'`)
  }

  const mapKeys: string[] = []
  for (const [userPath, identifier] of Object.entries(componentMap)) {
    mapKeys.push(`  "${userPath}": ${identifier}`)
  }

  const directive = useClientDirective ? `'use client'\n` : ''

  const importMapOutputFile = `${directive}${imports.join('\n')}

/** @type import('payload').ImportMap */
export const importMap = {
${mapKeys.join(',\n')}
}
`

  if (!force) {
    // Read current import map and check in the IMPORTS if there are any new imports. If not, don't write the file.
    let currentImportMap = ''
    try {
      currentImportMap = await fs.readFile(importMapFilePath, 'utf-8')
    } catch {
      // File doesn't exist yet — proceed to write.
    }

    if (currentImportMap?.trim() === importMapOutputFile?.trim()) {
      if (log) {
        console.log('No new imports found, skipping writing import map')
      }
      return
    }
  }

  if (log) {
    console.log('Writing import map to', importMapFilePath)
  }

  await fs.writeFile(importMapFilePath, importMapOutputFile)
}
