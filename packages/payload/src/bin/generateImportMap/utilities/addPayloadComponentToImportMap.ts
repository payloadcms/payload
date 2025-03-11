import crypto from 'crypto'
import path from 'path'

import type { PayloadComponent } from '../../../config/types.js'
import type { Imports, InternalImportMap } from '../index.js'

import { parsePayloadComponent } from './parsePayloadComponent.js'

/**
 * Adds a payload component to the import map.
 */
export function addPayloadComponentToImportMap({
  importMap,
  importMapToBaseDirPath,
  imports,
  payloadComponent,
}: {
  importMap: InternalImportMap
  importMapToBaseDirPath: string
  imports: Imports
  payloadComponent: PayloadComponent
}): {
  path: string
  specifier: string
} | null {
  if (!payloadComponent) {
    return null
  }
  const { exportName, path: componentPath } = parsePayloadComponent(payloadComponent)

  if (importMap[componentPath + '#' + exportName]) {
    return null
  }

  const importIdentifier =
    exportName + '_' + crypto.createHash('md5').update(componentPath).digest('hex')

  importMap[componentPath + '#' + exportName] = importIdentifier

  const isRelativePath = componentPath.startsWith('.') || componentPath.startsWith('/')

  if (isRelativePath) {
    const adjustedComponentPath = path.posix.join(importMapToBaseDirPath, componentPath)

    imports[importIdentifier] = {
      path: adjustedComponentPath,
      specifier: exportName,
    }
    return {
      path: adjustedComponentPath,
      specifier: exportName,
    }
  } else {
    // Tsconfig alias or package import, e.g. '@payloadcms/ui' or '@/components/MyComponent'
    imports[importIdentifier] = {
      path: componentPath,
      specifier: exportName,
    }
    return {
      path: componentPath,
      specifier: exportName,
    }
  }
}
