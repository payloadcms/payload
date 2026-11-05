import fse from 'fs-extra'
import globby from 'globby'
import path from 'path'

import type { TanStackAppDetails, TanStackAppKind, TanStackDetectionResult } from '../../types.js'

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const FILE_EXTENSIONS = 'js|jsx|ts|tsx|cjs|cts|mjs|mts'

export async function getTanStackAppDetails({
  projectDir,
}: {
  projectDir: string
}): Promise<TanStackDetectionResult> {
  const absoluteProjectDir = path.resolve(projectDir)
  const packageJson = await getPackageJson({ projectDir: absoluteProjectDir })
  const packages = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const isSolidHost = Boolean(
    packages['@tanstack/solid-router'] || packages['@tanstack/solid-start'],
  )
  const hasReactRouter = Boolean(packages['@tanstack/react-router'])
  const hasReactStart = Boolean(packages['@tanstack/react-start'])
  const hasRouterPlugin = Boolean(packages['@tanstack/router-plugin'])

  if (!isSolidHost && !hasReactRouter && !hasReactStart && !hasRouterPlugin) {
    return { detected: false }
  }

  if (isSolidHost) {
    return incompatible('TanStack Solid projects are not supported.')
  }

  if (hasReactStart && packages.next) {
    return incompatible('TanStack Start and Next.js markers are both present.')
  }

  if (!hasReactRouter) {
    return incompatible('Could not find @tanstack/react-router.')
  }

  const kind: TanStackAppKind = hasReactStart ? 'start' : 'router-only'
  const viteConfigPaths = await findFiles({
    cwd: absoluteProjectDir,
    pattern: `vite.config.@(${FILE_EXTENSIONS})`,
  })
  if (viteConfigPaths.length > 1) {
    return incompatible(
      getAmbiguousFilesReason({
        filePaths: viteConfigPaths,
        projectDir: absoluteProjectDir,
        role: 'Vite config',
      }),
    )
  }

  const viteConfigPath = viteConfigPaths[0]
  if (!viteConfigPath) {
    return incompatible('Could not find a Vite config file.')
  }

  const viteConfig = await fse.readFile(viteConfigPath, 'utf8')
  const pluginName = kind === 'start' ? 'tanstackStart' : 'tanstackRouter'
  if (!new RegExp(`\\b${pluginName}\\s*\\(`).test(viteConfig)) {
    return incompatible(`Could not find ${pluginName}() in ${viteConfigPath}.`)
  }

  const sourceDir = path.join(absoluteProjectDir, 'src')
  const routesDir = path.join(sourceDir, 'routes')
  const routerPaths = await findFiles({
    cwd: sourceDir,
    pattern: `router.@(${FILE_EXTENSIONS})`,
  })
  if (routerPaths.length > 1) {
    return incompatible(
      getAmbiguousFilesReason({
        filePaths: routerPaths,
        projectDir: absoluteProjectDir,
        role: 'router',
      }),
    )
  }

  const routerPath = routerPaths[0]
  if (!routerPath) {
    return incompatible(`Could not find src/router.* in ${absoluteProjectDir}.`)
  }

  const router = await fse.readFile(routerPath, 'utf8')
  if (!/\bgetRouter\b/.test(router)) {
    return incompatible(`Could not find getRouter in ${routerPath}.`)
  }

  const rootRoutePaths = await findFiles({
    cwd: routesDir,
    pattern: `__root.@(${FILE_EXTENSIONS})`,
  })
  if (rootRoutePaths.length > 1) {
    return incompatible(
      getAmbiguousFilesReason({
        filePaths: rootRoutePaths,
        projectDir: absoluteProjectDir,
        role: 'root route',
      }),
    )
  }

  const rootRoutePath = rootRoutePaths[0]
  if (!rootRoutePath) {
    return incompatible(`Could not find src/routes/__root.* in ${absoluteProjectDir}.`)
  }

  const details: TanStackAppDetails = {
    isPayloadInstalled: Boolean(packages.payload),
    kind,
    projectDir: absoluteProjectDir,
    rootRoutePath,
    routerPath,
    routesDir,
    sourceDir,
    viteConfigPath,
  }

  return { compatible: true, details, detected: true }
}

function incompatible(reason: string): TanStackDetectionResult {
  return { compatible: false, detected: true, reason }
}

function getAmbiguousFilesReason({
  filePaths,
  projectDir,
  role,
}: {
  filePaths: string[]
  projectDir: string
  role: string
}): string {
  const relativePaths = filePaths.map((filePath) => path.relative(projectDir, filePath)).sort()

  return `Found multiple supported ${role} files: ${relativePaths.join(', ')}.`
}

async function findFiles({ cwd, pattern }: { cwd: string; pattern: string }): Promise<string[]> {
  return globby(pattern, {
    absolute: true,
    cwd,
    onlyFiles: true,
  })
}

async function getPackageJson({ projectDir }: { projectDir: string }): Promise<PackageJson> {
  const packageJsonPath = path.join(projectDir, 'package.json')

  if (!(await fse.pathExists(packageJsonPath))) {
    return {}
  }

  return fse.readJson(packageJsonPath) as Promise<PackageJson>
}
