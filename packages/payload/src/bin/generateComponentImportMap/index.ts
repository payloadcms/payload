import type React from 'react'

import fs from 'fs'
import process from 'node:process'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'

import { iterateConfig } from './iterateConfig.js'
import { parsePayloadComponent } from './parsePayloadComponent.js'
const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

type ImportIdentifier = string
type ImportSpecifier = string
type ImportPath = string
type UserImportPath = string

export type ImportMap = {
  [path: UserImportPath]: ImportIdentifier
}

export type Imports = {
  [identifier: ImportIdentifier]: {
    path: ImportPath
    specifier: ImportSpecifier
  }
}

export type ComponentImportMap = {
  [path: UserImportPath]: React.FC
}

export function addPayloadComponentToImportMap({
  baseDir,
  importMap,
  imports,
  payloadComponent,
}: {
  baseDir: string
  importMap: ImportMap
  imports: Imports
  payloadComponent: PayloadComponent
}) {
  if (!payloadComponent) {
    return
  }
  const { exportName, path: componentPath } = parsePayloadComponent(payloadComponent)

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

export type AddToComponentImportMap = (
  payloadComponent: PayloadComponent | PayloadComponent[],
) => void

export async function generateComponentImportMap(
  config: SanitizedConfig,
  options?: { log: boolean },
): Promise<void> {
  console.log('Generating component map')
  const componentMap: ImportMap = {}
  const importMap: Imports = {}

  const addToComponentImportMap: AddToComponentImportMap = (payloadComponent) => {
    if (!payloadComponent) {
      return
    }
    if (Array.isArray(payloadComponent)) {
      for (const component of payloadComponent) {
        addPayloadComponentToImportMap({
          baseDir: config.admin.componentImportMap.baseDir,
          importMap: componentMap,
          imports: importMap,
          payloadComponent: component,
        })
      }
    } else {
      addPayloadComponentToImportMap({
        baseDir: config.admin.componentImportMap.baseDir,
        importMap: componentMap,
        imports: importMap,
        payloadComponent,
      })
    }
  }

  iterateConfig({
    addToComponentImportMap,
    baseDir: config.admin.componentImportMap.baseDir,
    componentMap,
    config,
    importMap,
  })

  await writeComponentMap({
    componentMap,
    fileName: 'componentImportMap.js',
    importMap,
    log: options?.log,
  })
}

export async function writeComponentMap({
  componentMap,
  fileName,
  importMap,
  log,
}: {
  componentMap: ImportMap
  fileName: string
  importMap: Imports
  log?: boolean
}) {
  const outputFile = path.resolve(
    process.env.NEXT_PUBLIC_ROOT_DIR,
    `app/(payload)/admin/${fileName}`,
  )
  // Read current component map and check in the IMPORTS if there are any new imports. If not, don't write the file.
  const currentComponentMap = await fs.promises.readFile(outputFile, 'utf-8')
  const currentComponentMapImports = currentComponentMap
    .split('\n')
    .filter((line) => line.startsWith('import'))
  let hasAllImports = true
  for (const { path, specifier } of Object.values(importMap)) {
    let foundImport = false
    for (const currentComponentMapImport of currentComponentMapImports) {
      if (
        currentComponentMapImport.includes(path) &&
        currentComponentMapImport.includes(specifier)
      ) {
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

  const imports: string[] = []
  for (const [identifier, { path, specifier }] of Object.entries(importMap)) {
    imports.push(`import { ${specifier} as ${identifier} } from '${path}'`)
  }

  const mapKeys: string[] = []
  for (const [userPath, identifier] of Object.entries(componentMap)) {
    mapKeys.push(`  "${userPath}": ${identifier}`)
  }

  const componentMapFile = `${imports.join('\n')}

export const componentImportMap = {
${mapKeys.join(',\n')}
}
`

  if (log) {
    console.log(componentMapFile)
  }

  console.log('Writing component map to', outputFile)
  await fs.promises.writeFile(outputFile, componentMapFile)
}
