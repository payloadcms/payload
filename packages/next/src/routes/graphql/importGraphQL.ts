/**
 * GraphQL is opt-in. Its packages are optional peer dependencies of `@payloadcms/next`, so they are
 * imported lazily here rather than at module scope - that keeps them out of the module graph of
 * apps that only use the REST API.
 */

const INSTALL_HINT =
  'GraphQL is opt-in. Install it with: pnpm add @payloadcms/graphql graphql graphql-http graphql-playground-html'

/**
 * Awaits `importer`, rewriting a "package is not installed" failure into an actionable error.
 * Exported for testing - prefer the named `import*` helpers below.
 */
export const importOptional = async <T>({
  importer,
  packageName,
}: {
  importer: () => Promise<T>
  packageName: string
}): Promise<T> => {
  try {
    return await importer()
  } catch (err) {
    if (isModuleNotFound({ err, packageName })) {
      throw new Error(
        `Cannot find module '${packageName}', required to serve GraphQL. ${INSTALL_HINT}`,
      )
    }

    throw err
  }
}

/**
 * Only treat a missing-module error for `packageName` itself as "not installed" - an unrelated
 * resolution failure from inside the package should surface as-is.
 */
const isModuleNotFound = ({ err, packageName }: { err: unknown; packageName: string }): boolean => {
  if (!err || typeof err !== 'object') {
    return false
  }

  const { code, message } = err as { code?: string; message?: string }

  if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
    return false
  }

  return typeof message === 'string' && message.includes(packageName)
}

export const importConfigToSchema = async () =>
  (
    await importOptional({
      importer: () => import('@payloadcms/graphql'),
      packageName: '@payloadcms/graphql',
    })
  ).configToSchema

export const importCreateHandler = async () =>
  (
    await importOptional({
      importer: () => import('graphql-http/lib/use/fetch'),
      packageName: 'graphql-http',
    })
  ).createHandler

export const importRenderPlaygroundPage = async () =>
  (
    await importOptional({
      importer: () => import('graphql-playground-html'),
      packageName: 'graphql-playground-html',
    })
  ).renderPlaygroundPage
