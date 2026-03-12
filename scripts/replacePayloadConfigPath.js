import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Replace the @payload-config path in tsconfig.base.json using string replacement
 * to avoid reformatting the entire file.
 */
export async function replacePayloadConfigPath(rootDir, configPath) {
  const tsConfigBasePath = path.resolve(rootDir, './tsconfig.base.json')
  const tsConfigPath = existsSync(tsConfigBasePath)
    ? tsConfigBasePath
    : path.resolve(rootDir, './tsconfig.json')

  const content = await fs.readFile(tsConfigPath, 'utf8')
  const updated = content.replace(
    /("@payload-config":\s*\[\s*)"[^"]*"(\s*\])/,
    `$1"${configPath}"$2`,
  )
  await fs.writeFile(tsConfigPath, updated)
}
