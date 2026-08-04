import fs from 'fs'
import fsp from 'fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()

/**
 * Copy the necessary template files from `templates/blank` to `dist/template`
 *
 * Eventually, this should be replaced with using tar.x to stream from the git repo
 */

async function main() {
  const root = path.resolve(dirname, '../../../../')
  const outputPath = path.resolve(dirname, '../../dist/template')
  const sourceTemplatePath = path.resolve(root, 'templates/blank')
  const tanStackOutputPath = path.resolve(dirname, '../../dist/template-tanstack')
  const tanStackSourcePath = path.resolve(root, 'templates/blank-tanstack/src')

  if (!fs.existsSync(sourceTemplatePath)) {
    throw new Error(`Source path does not exist: ${sourceTemplatePath}`)
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true })
  }

  // Copy the src directory from `templates/blank` to `dist`
  const srcPath = path.resolve(sourceTemplatePath, 'src')
  const distSrcPath = path.resolve(outputPath, 'src')
  // Copy entire file structure from src to dist
  await fsp.cp(srcPath, distSrcPath, { recursive: true })

  if (!fs.existsSync(tanStackSourcePath)) {
    throw new Error(`Source path does not exist: ${tanStackSourcePath}`)
  }

  await fsp.rm(tanStackOutputPath, { force: true, recursive: true })

  const tanStackDistSrcPath = path.join(tanStackOutputPath, 'src')
  const tanStackDistRoutesPath = path.join(tanStackOutputPath, 'routes')
  await Promise.all([
    fsp.mkdir(tanStackDistSrcPath, { recursive: true }),
    fsp.mkdir(tanStackDistRoutesPath, { recursive: true }),
  ])
  await Promise.all([
    fsp.cp(
      path.join(tanStackSourcePath, 'collections'),
      path.join(tanStackDistSrcPath, 'collections'),
      { recursive: true },
    ),
    fsp.copyFile(
      path.join(tanStackSourcePath, 'payload-foundation.css'),
      path.join(tanStackDistSrcPath, 'payload-foundation.css'),
    ),
    fsp.copyFile(
      path.join(tanStackSourcePath, 'payload.config.ts'),
      path.join(tanStackDistSrcPath, 'payload.config.ts'),
    ),
    fsp.cp(
      path.join(tanStackSourcePath, 'app/_payload'),
      path.join(tanStackDistRoutesPath, '_payload'),
      { recursive: true },
    ),
    fsp.copyFile(
      path.join(tanStackSourcePath, 'app/_payload.tsx'),
      path.join(tanStackDistRoutesPath, '_payload.tsx'),
    ),
  ])
}
