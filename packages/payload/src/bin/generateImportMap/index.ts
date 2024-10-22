import fs from 'fs'
import process from 'node:process'
import path from 'path'

import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'

import { iterateConfig } from './iterateConfig.js'
import { parsePayloadComponent } from './parsePayloadComponent.js'

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

export function addPayloadComponentToImportMap({
  baseDir,
  importMap,
  imports,
  payloadComponent,
}: {
  baseDir: string
  importMap: InternalImportMap
  imports: Imports
  payloadComponent: PayloadComponent
}) {
  if (!payloadComponent) {
    return
  }
  const { exportName, path: componentPath } = parsePayloadComponent(payloadComponent)

  if (importMap[componentPath + '#' + exportName]) {
    return
  }

  const importIdentifier = exportName + '_' + Object.keys(imports).length

  // e.g. if baseDir is /test/fields and componentPath is /components/Field.tsx
  // then path needs to be /test/fields/components/Field.tsx NOT /users/username/project/test/fields/components/Field.tsx
  // so we need to append baseDir to componentPath

  imports[importIdentifier] = {
    path:
      componentPath.startsWith('.') || componentPath.startsWith('/')
        ? path.posix.join(baseDir.replace(/\\/g, '/'), componentPath.slice(1))
        : componentPath,
    specifier: exportName,
  }
  importMap[componentPath + '#' + exportName] = importIdentifier
}

export type AddToImportMap = (payloadComponent: PayloadComponent | PayloadComponent[]) => void

export async function generateImportMap(
  config: SanitizedConfig,
  options?: { force?: boolean; log: boolean },
): Promise<void> {
  const shouldLog = options?.log ?? true

  if (shouldLog) {
    console.log('Generating import map')
  }

  const importMap: InternalImportMap = {}
  const imports: Imports = {}

  const rootDir = process.env.ROOT_DIR ?? process.cwd()

  // get componentsBaseDir.
  // E.g.:
  // config.admin.importMap.baseDir = /test/fields/
  // rootDir: /
  // componentsBaseDir = /test/fields/

  // or

  // E.g.:
  // config.admin.importMap.baseDir = /test/fields/
  // rootDir: /test
  // componentsBaseDir = /fields/

  // or
  // config.admin.importMap.baseDir = /
  // rootDir: /
  // componentsBaseDir = /

  const componentsBaseDir = path.relative(rootDir, config.admin.importMap.baseDir)

  const addToImportMap: AddToImportMap = (payloadComponent) => {
    if (!payloadComponent) {
      return
    }

    if (typeof payloadComponent !== 'object' && typeof payloadComponent !== 'string') {
      console.error(payloadComponent)
      throw new Error('addToImportMap > Payload component must be an object or a string')
    }

    if (Array.isArray(payloadComponent)) {
      for (const component of payloadComponent) {
        addPayloadComponentToImportMap({
          baseDir: componentsBaseDir,
          importMap,
          imports,
          payloadComponent: component,
        })
      }
    } else {
      addPayloadComponentToImportMap({
        baseDir: componentsBaseDir,
        importMap,
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
    config,
    fileName: 'importMap.js',
    force: options?.force,
    importMap: imports,
    log: shouldLog,
    rootDir,
  })
}

export async function writeImportMap({
  componentMap,
  config,
  fileName,
  force,
  importMap,
  log,
  rootDir,
}: {
  componentMap: InternalImportMap
  config: SanitizedConfig
  fileName: string
  force?: boolean
  importMap: Imports
  log?: boolean
  rootDir: string
}) {
  let importMapFolderPath = ''
  const adminPath = config.routes.admin || '/admin'
  if (fs.existsSync(path.resolve(rootDir, `app/(payload)${adminPath}/`))) {
    importMapFolderPath = path.resolve(rootDir, `app/(payload)${adminPath}/`)
  } else if (fs.existsSync(path.resolve(rootDir, `src/app/(payload)${adminPath}/`))) {
    importMapFolderPath = path.resolve(rootDir, `src/app/(payload)${adminPath}/`)
  } else {
    throw new Error(
      `Could not find the payload admin directory. Looked in ${path.resolve(rootDir, `app/(payload)${adminPath}/`)} and ${path.resolve(rootDir, `src/app/(payload)${adminPath}/`)}`,
    )
  }

  const imports: string[] = []
  for (const [identifier, { path, specifier }] of Object.entries(importMap)) {
    imports.push(`import { ${specifier} as ${identifier} } from '${path}'`)
  }

  const mapKeys: string[] = []
  for (const [userPath, identifier] of Object.entries(componentMap)) {
    mapKeys.push(`  "${userPath}": ${identifier}`)
  }

  const importMapOutputFile = `${imports.join('\n')}

export const importMap = {
${mapKeys.join(',\n')}
}
`

  const importMapFilePath = path.resolve(importMapFolderPath, fileName)

  if (!force) {
    // Read current import map and check in the IMPORTS if there are any new imports. If not, don't write the file.
    const currentImportMap = await fs.promises.readFile(importMapFilePath, 'utf-8')

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

  await fs.promises.writeFile(importMapFilePath, importMapOutputFile)
}
