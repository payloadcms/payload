/**
 * GraphQL is opt-in. Its packages are optional peer dependencies of `@payloadcms/tanstack-start`,
 * so they are imported lazily here rather than at module scope - that keeps them out of the module
 * graph of apps that only use the REST API. The specifiers are held in variables with
 * `@vite-ignore` so Vite does not try to resolve them when they are not installed.
 */

const INSTALL_HINT =
  'GraphQL is opt-in. Install it with: pnpm add @payloadcms/graphql graphql graphql-http'

const importOptional = async ({
  packageName,
  specifier,
}: {
  packageName: string
  specifier: string
}) => {
  try {
    return await import(/* @vite-ignore */ specifier)
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
  (await importOptional({ packageName: '@payloadcms/graphql', specifier: '@payloadcms/graphql' }))
    .configToSchema

export const importCreateHandler = async () =>
  (await importOptional({ packageName: 'graphql-http', specifier: 'graphql-http/lib/use/fetch' }))
    .createHandler
