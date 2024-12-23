import fse from 'fs-extra'
import path from 'path'

import { toCamelCase, toPascalCase } from '../utils/casing.js'

/**
 * Configures a plugin project by updating all package name placeholders to projectName
 */
export const configurePluginProject = ({
  projectDirPath,
  projectName,
}: {
  projectDirPath: string
  projectName: string
}) => {
  const devPayloadConfigPath = path.resolve(projectDirPath, './dev/payload.config.ts')
  const devTsConfigPath = path.resolve(projectDirPath, './dev/tsconfig.json')
  const indexTsPath = path.resolve(projectDirPath, './src/index.ts')

  const devPayloadConfig = fse.readFileSync(devPayloadConfigPath, 'utf8')
  const devTsConfig = fse.readFileSync(devTsConfigPath, 'utf8')
  const indexTs = fse.readFileSync(indexTsPath, 'utf-8')

  const updatedTsConfig = devTsConfig.replaceAll('plugin-package-name-placeholder', projectName)
  let updatedIndexTs = indexTs.replaceAll('plugin-package-name-placeholder', projectName)
  updatedIndexTs = updatedIndexTs.replace(
    'export const myPlugin',
    `export const ${toCamelCase(projectName)}`,
  )
  updatedIndexTs = updatedIndexTs.replace(
    'export type MyPluginConfig',
    `export type ${toPascalCase(projectName)}Config`,
  )

  const updatedPayloadConfig = devPayloadConfig.replaceAll(
    'plugin-package-name-placeholder',
    projectName,
  )

  fse.writeFileSync(devPayloadConfigPath, updatedPayloadConfig)
  fse.writeFileSync(devTsConfigPath, updatedTsConfig)
  fse.writeFileSync(indexTsPath, updatedIndexTs)
}
