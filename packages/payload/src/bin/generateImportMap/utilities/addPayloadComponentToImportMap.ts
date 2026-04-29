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
 *
 * When `clientImportMap` and `clientImports` are provided AND `clientBundleable` is true,
 * the entry is mirrored into them so it can be emitted into a separate `importMap.client.js`
 * sibling artifact (a `'use client'` module). That client-only file is what crosses the
 * RSC boundary for in-browser ref resolution (admin.condition / admin.validate / field
 * components). The full server-side `importMap` continues to receive every entry.
 */
export function addPayloadComponentToImportMap({
  clientBundleable,
  clientImportMap,
  clientImports,
  importMap,
  importMapToBaseDirPath,
  imports,
  payloadComponent,
}: {
  clientBundleable?: boolean
  clientImportMap?: InternalImportMap
  clientImports?: Imports
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

  const key = componentPath + '#' + exportName
  const alreadyInImportMap = Boolean(importMap[key])

  // Even if the entry already exists in importMap, it may still be missing from
  // clientImportMap if it was first registered as server-only. Allow client-bundleable
  // refs to upgrade an existing server entry into the client map without re-registering
  // its server import.
  if (alreadyInImportMap && (!clientBundleable || !clientImportMap || clientImportMap[key])) {
    return null
  }

  let importIdentifier = importMap[key]
  if (!importIdentifier) {
    importIdentifier =
      exportName + '_' + crypto.createHash('md5').update(componentPath).digest('hex')
    importMap[key] = importIdentifier
  }

  const isRelativePath = componentPath.startsWith('.') || componentPath.startsWith('/')

  let resolvedPath: string
  if (isRelativePath) {
    resolvedPath = getAdjustedComponentPath(importMapToBaseDirPath, componentPath)
  } else {
    // Tsconfig alias or package import, e.g. '@payloadcms/ui' or '@/components/MyComponent'
    resolvedPath = componentPath
  }

  if (!alreadyInImportMap) {
    imports[importIdentifier] = {
      path: resolvedPath,
      specifier: exportName,
    }
  }

  if (clientBundleable && clientImportMap && clientImports) {
    clientImportMap[key] = importIdentifier
    clientImports[importIdentifier] = {
      path: resolvedPath,
      specifier: exportName,
    }
  }

  return {
    path: resolvedPath,
    specifier: exportName,
  }
}
