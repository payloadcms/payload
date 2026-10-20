import { createRequire } from 'node:module'
import path from 'node:path'

import { buildExternalPackages, ssrExternalPackages } from './external.js'

/** Keeps installed server packages in Node while preserving Vite transforms for workspace source. */
export function getPublishedServerExternalPackages({
  payloadConfigPath,
}: {
  payloadConfigPath: string
}): string[] {
  const require = createRequire(path.resolve(payloadConfigPath))
  const isPublishedJavaScript = ({ specifier }: { specifier: string }): boolean => {
    try {
      const resolved = require.resolve(specifier).replaceAll('\\', '/')

      return resolved.includes('/node_modules/') && /\.[cm]?js$/.test(resolved)
    } catch {
      return false
    }
  }

  // An external adapter would import raw Payload source through Node in a workspace.
  if (!isPublishedJavaScript({ specifier: 'payload' })) {
    return []
  }

  return buildExternalPackages.filter(
    (specifier) => !ssrExternalPackages.includes(specifier) && isPublishedJavaScript({ specifier }),
  )
}
