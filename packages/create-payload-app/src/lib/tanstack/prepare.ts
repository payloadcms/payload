import fse from 'fs-extra'
import globby from 'globby'
import path from 'node:path'

import type { TanStackAppDetails } from '../../types.js'
import type { TextTransformResult } from './transform-vite-config.js'

import { transformTanStackRootRoute } from './transform-root-route.js'
import { transformTanStackRouter } from './transform-router.js'
import { transformTanStackViteConfig } from './transform-vite-config.js'

export type PreparedWrite = {
  /** Exact content to write after every preparation check succeeds. */
  content: string
  /** Absolute destination path in the detected host project. */
  filePath: string
}

type PrepareResult = { reason: string; success: false } | { success: true; writes: PreparedWrite[] }

type TemplateFile = {
  destinationRoot: string
  relativePath: string
  sourceRoot: string
}

const REQUIRED_TEMPLATE_FILES = ['src/payload.config.ts', 'src/payload-foundation.css']
const REQUIRED_ROUTE_FILES = ['routes/_payload.tsx']

export async function prepareTanStackInit({
  appDetails,
  templateRoot,
}: {
  appDetails: TanStackAppDetails
  templateRoot: string
}): Promise<PrepareResult> {
  try {
    const templateFilesResult = await getTemplateFiles({ appDetails, templateRoot })
    if (!templateFilesResult.success) {
      return templateFilesResult
    }

    const [viteConfigContent, routerContent, rootRouteContent, ...templateContents] =
      await Promise.all([
        fse.readFile(appDetails.viteConfigPath, 'utf8'),
        fse.readFile(appDetails.routerPath, 'utf8'),
        fse.readFile(appDetails.rootRoutePath, 'utf8'),
        ...templateFilesResult.files.map(({ relativePath, sourceRoot }) =>
          fse.readFile(path.join(sourceRoot, relativePath), 'utf8'),
        ),
      ])

    const transformedFiles: Array<{
      filePath: string
      result: TextTransformResult
    }> = [
      {
        filePath: appDetails.viteConfigPath,
        result: transformTanStackViteConfig({ appDetails, content: viteConfigContent }),
      },
      {
        filePath: appDetails.routerPath,
        result: transformTanStackRouter({ content: routerContent }),
      },
      {
        filePath: appDetails.rootRoutePath,
        result: transformTanStackRootRoute({ content: rootRouteContent, kind: appDetails.kind }),
      },
    ]

    const failedTransform = transformedFiles.find(({ result }) => !result.success)
    if (failedTransform && !failedTransform.result.success) {
      return {
        reason: `Could not transform ${failedTransform.filePath}: ${failedTransform.result.reason}`,
        success: false,
      }
    }

    const writes: PreparedWrite[] = transformedFiles.flatMap(({ filePath, result }) =>
      result.success && result.modified ? [{ content: result.content, filePath }] : [],
    )

    for (const [index, templateFile] of templateFilesResult.files.entries()) {
      const content = templateContents[index]!
      const filePath = path.join(templateFile.destinationRoot, templateFile.relativePath)

      if (await fse.pathExists(filePath)) {
        const existingContent = await fse.readFile(filePath, 'utf8')
        if (existingContent !== content) {
          return { reason: `A different file already exists at ${filePath}.`, success: false }
        }

        continue
      }

      writes.push({ content, filePath })
    }

    return { success: true, writes }
  } catch (error) {
    return {
      reason: error instanceof Error ? error.message : 'Could not prepare TanStack files.',
      success: false,
    }
  }
}

export async function applyPreparedWrites({ writes }: { writes: PreparedWrite[] }): Promise<void> {
  for (const { content, filePath } of writes) {
    await fse.ensureDir(path.dirname(filePath))
    await fse.writeFile(filePath, content)
  }
}

async function getTemplateFiles({
  appDetails,
  templateRoot,
}: {
  appDetails: TanStackAppDetails
  templateRoot: string
}): Promise<{ files: TemplateFile[]; success: true } | { reason: string; success: false }> {
  for (const relativePath of [...REQUIRED_TEMPLATE_FILES, ...REQUIRED_ROUTE_FILES]) {
    const filePath = path.join(templateRoot, relativePath)
    if (!(await fse.pathExists(filePath))) {
      return { reason: `Required TanStack template file is missing: ${filePath}.`, success: false }
    }
  }

  const [collectionFiles, payloadRouteFiles] = await Promise.all([
    globby('collections/**/*', {
      cwd: path.join(templateRoot, 'src'),
      onlyFiles: true,
    }),
    globby('_payload/**/*', {
      cwd: path.join(templateRoot, 'routes'),
      onlyFiles: true,
    }),
  ])

  if (collectionFiles.length === 0) {
    return {
      reason: `Required TanStack template directory has no files: ${path.join(templateRoot, 'src/collections')}.`,
      success: false,
    }
  }

  if (payloadRouteFiles.length === 0) {
    return {
      reason: `Required TanStack template directory has no files: ${path.join(templateRoot, 'routes/_payload')}.`,
      success: false,
    }
  }

  const sourceFiles = [
    ...REQUIRED_TEMPLATE_FILES.map((file) => path.relative('src', file)),
    ...collectionFiles,
  ]
  const routeFiles = [
    ...REQUIRED_ROUTE_FILES.map((file) => path.relative('routes', file)),
    ...payloadRouteFiles,
  ]

  return {
    files: [
      ...sourceFiles.sort().map((relativePath) => ({
        destinationRoot: appDetails.sourceDir,
        relativePath,
        sourceRoot: path.join(templateRoot, 'src'),
      })),
      ...routeFiles.sort().map((relativePath) => ({
        destinationRoot: appDetails.routesDir,
        relativePath,
        sourceRoot: path.join(templateRoot, 'routes'),
      })),
    ],
    success: true,
  }
}
