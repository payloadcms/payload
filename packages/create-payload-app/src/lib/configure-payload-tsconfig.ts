import { parse, stringify } from 'comment-json'
import fse from 'fs-extra'
import path from 'node:path'

import { warning } from '../utils/log.js'

type TsConfig = {
  compilerOptions?: {
    baseUrl?: string
    paths?: Record<string, string[]>
  }
}

export async function configurePayloadTsConfig({
  configPath,
  payloadConfigPath,
}: {
  configPath: string
  payloadConfigPath: string
}): Promise<void> {
  if (!(await fse.pathExists(configPath))) {
    warning('Could not find tsconfig.json to add @payload-config path.')
    return
  }

  const content = await fse.readFile(configPath, 'utf8')
  const tsConfig = parse(content) as TsConfig

  tsConfig.compilerOptions ??= {}
  tsConfig.compilerOptions.paths ??= {}

  if (tsConfig.compilerOptions.paths['@payload-config']) {
    return
  }

  const baseUrlPath = path.resolve(
    path.dirname(configPath),
    tsConfig.compilerOptions.baseUrl ?? '.',
  )
  const relativePayloadConfigPath = path
    .relative(baseUrlPath, payloadConfigPath)
    .split(path.sep)
    .join('/')
  const payloadAliasPath = relativePayloadConfigPath.startsWith('.')
    ? relativePayloadConfigPath
    : `./${relativePayloadConfigPath}`

  tsConfig.compilerOptions.paths['@payload-config'] = [payloadAliasPath]
  await fse.writeFile(configPath, stringify(tsConfig, null, 2), 'utf8')
}
