import crypto from 'crypto'
import path from 'path'

import type { PayloadComponent } from '../../../config/types.js'
import type { Imports, InternalImportMap } from '../index.js'

import { parsePayloadComponent } from './parsePayloadComponent.js'

/**
 * Normalizes the component path based on the import map's base directory path.
 */
function getAdjustedComponentPath(importMapToBaseDirPath: string, componentPath: string): string {
  // Normalize input paths to use forward slashes
  const normalizedBasePath = importMapToBaseDirPath.replace(/\\/g, '/')
  const normalizedComponentPath = componentPath.replace(/\\/g, '/')

  // Base path starts with './' - preserve the './' prefix
  // => import map is in a subdirectory of the base directory, or in the same directory as the base directory
  if (normalizedBasePath.startsWith('./')) {
    // Remove './' from component path if it exists
    const cleanComponentPath = normalizedComponentPath.startsWith('./')
      ? normalizedComponentPath.substring(2)
      : normalizedComponentPath

    // Join the paths to preserve the './' prefix
    return `${normalizedBasePath}${cleanComponentPath}`
  }

  return path.posix.join(normalizedBasePath, normalizedComponentPath)
}

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
    const adjustedComponentPath = getAdjustedComponentPath(importMapToBaseDirPath, componentPath)

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
