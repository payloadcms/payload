import type React from 'react'

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
  [path: UserImportPath]: React.FC
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
  imports[importIdentifier] = {
    path:
      componentPath.startsWith('.') || componentPath.startsWith('/')
        ? path.resolve(baseDir, componentPath.slice(1))
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
  console.log('Generating import map')
  const importMap: InternalImportMap = {}
  const imports: Imports = {}

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
          baseDir: config.admin.importMap.baseDir,
          importMap,
          imports,
          payloadComponent: component,
        })
      }
    } else {
      addPayloadComponentToImportMap({
        baseDir: config.admin.importMap.baseDir,
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
    fileName: 'importMap.js',
    force: options?.force,
    importMap: imports,
    log: options?.log,
  })
}

export async function writeImportMap({
  componentMap,
  fileName,
  force,
  importMap,
  log,
}: {
  componentMap: InternalImportMap
  fileName: string
  force?: boolean
  importMap: Imports
  log?: boolean
}) {
  const outputFile = path.resolve(
    process.env.NEXT_PUBLIC_ROOT_DIR,
    `app/(payload)/admin/${fileName}`,
  )

  if (!force) {
    // Read current component map and check in the IMPORTS if there are any new imports. If not, don't write the file.
    const currentImportMap = await fs.promises.readFile(outputFile, 'utf-8')
    const currentImportMapImports = currentImportMap
      .split('\n')
      .filter((line) => line.startsWith('import'))
    let hasAllImports = true
    for (const { path, specifier } of Object.values(importMap)) {
      let foundImport = false
      for (const currentImportMapImport of currentImportMapImports) {
        if (currentImportMapImport.includes(path) && currentImportMapImport.includes(specifier)) {
          foundImport = true
          break
        }
      }
      if (!foundImport) {
        hasAllImports = false
        break
      }
    }

    if (hasAllImports) {
      console.log('No new imports found, skipping writing component map')
      return
    }
  }

  const imports: string[] = []
  for (const [identifier, { path, specifier }] of Object.entries(importMap)) {
    imports.push(`import { ${specifier} as ${identifier} } from '${path}'`)
  }

  const mapKeys: string[] = []
  for (const [userPath, identifier] of Object.entries(componentMap)) {
    mapKeys.push(`  "${userPath}": ${identifier}`)
  }

  const importMapFile = `${imports.join('\n')}

export const importMap = {
${mapKeys.join(',\n')}
}
`

  if (log) {
    console.log(importMapFile)
  }

  console.log('Writing component map to', outputFile)
  await fs.promises.writeFile(outputFile, importMapFile)
}
