import type { Payload } from 'payload'

import { execFile } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { createRequire } from 'module'
import path from 'path'
import { dynamicImport } from 'payload'
import { promisify } from 'util'

/**
 * The subset of Prettier's API used here. Prettier isn't a dependency, so its types aren't available.
 */
type Prettier = {
  format: (source: string, options: Record<string, unknown>) => Promise<string>
  resolveConfig: (filePath: string) => Promise<null | Record<string, unknown>>
  resolveConfigFile: () => Promise<null | string>
}

const execFileAsync = promisify(execFile)

/**
 * Formats a generated file in place with the project's formatter and formatter config: oxfmt if
 * it's installed, otherwise Prettier. Logs an error if neither can format the file.
 */
export async function formatGeneratedFile({
  filePath,
  logger,
}: {
  filePath: string
  logger: Payload['logger']
}): Promise<void> {
  let formatError: unknown

  // oxfmt's `format()` API doesn't discover config files, so run the project's oxfmt CLI instead
  let oxfmtBinPath: string | undefined
  try {
    const projectRequire = createRequire(path.join(process.cwd(), 'package.json'))
    const packageJSONPath = projectRequire.resolve('oxfmt/package.json')
    const { bin } = projectRequire(packageJSONPath) as { bin: { oxfmt: string } }
    oxfmtBinPath = path.join(path.dirname(packageJSONPath), bin.oxfmt)
  } catch {
    // oxfmt isn't installed
  }

  if (oxfmtBinPath) {
    try {
      await execFileAsync(
        process.execPath,
        // Loading `oxfmt.config.ts` relies on Node's type stripping, which `NODE_OPTIONS` may disable
        ['--experimental-strip-types', oxfmtBinPath, '--no-error-on-unmatched-pattern', filePath],
        { cwd: process.cwd() },
      )
      return
    } catch (err) {
      formatError = err
    }
  }

  try {
    const prettier = await dynamicImport<Prettier>('prettier')
    const configPath = await prettier.resolveConfigFile()
    const config = configPath ? await prettier.resolveConfig(configPath) : {}
    const code = await readFile(filePath, 'utf-8')
    await writeFile(filePath, await prettier.format(code, { ...config, parser: 'typescript' }))
    return
  } catch (err) {
    formatError ??= err
  }

  logger.error({ err: formatError, msg: `Could not format ${filePath} with oxfmt or Prettier` })
}
