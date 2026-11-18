import fse from 'fs-extra'
import path from 'node:path'

import type { TanStackAppDetails } from '../../types.js'
import type { TextTransformResult } from './transform-vite-config.js'

import { TANSTACK_TEMPLATE_FILES } from './template-files.js'
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
  filePath: string
  templatePath: string
}

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
        ...templateFilesResult.files.map(({ templatePath }) => fse.readFile(templatePath, 'utf8')),
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
      const { filePath } = templateFile

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
  const files: TemplateFile[] = []
  const hasPackedTemplateLayout = await fse.pathExists(path.join(templateRoot, 'routes'))

  for (const { destination, relativePath, sourcePath } of TANSTACK_TEMPLATE_FILES) {
    const templatePath = hasPackedTemplateLayout
      ? path.join(templateRoot, destination, relativePath)
      : path.join(templateRoot, sourcePath)
    if (!(await fse.pathExists(templatePath))) {
      return {
        reason: `Required TanStack template file is missing: ${templatePath}.`,
        success: false,
      }
    }

    files.push({
      filePath: path.join(
        destination === 'src' ? appDetails.sourceDir : appDetails.routesDir,
        relativePath,
      ),
      templatePath,
    })
  }

  return { files, success: true }
}
