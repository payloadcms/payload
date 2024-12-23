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

  const pluginExportVariableName = toCamelCase(projectName)

  updatedIndexTs = updatedIndexTs.replace(
    'export const myPlugin',
    `export const ${pluginExportVariableName}`,
  )

  updatedIndexTs = updatedIndexTs.replaceAll('MyPluginConfig', `${toPascalCase(projectName)}Config`)

  let updatedPayloadConfig = devPayloadConfig.replace(
    'plugin-package-name-placeholder',
    projectName,
  )

  updatedPayloadConfig = updatedPayloadConfig.replaceAll('myPlugin', pluginExportVariableName)

  fse.writeFileSync(devPayloadConfigPath, updatedPayloadConfig)
  fse.writeFileSync(devTsConfigPath, updatedTsConfig)
  fse.writeFileSync(indexTsPath, updatedIndexTs)
}
