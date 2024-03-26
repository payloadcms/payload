import fse from 'fs-extra'
import path from 'path'

import type { DbDetails } from '../types.js'

import { warning } from '../utils/log.js'
import { bundlerPackages, dbPackages, editorPackages } from './packages.js'

/** Update payload config with necessary imports and adapters */
export async function configurePayloadConfig(args: {
  dbDetails: DbDetails | undefined
  projectDir: string
}): Promise<void> {
  if (!args.dbDetails) {
    return
  }

  // Update package.json
  const packageJsonPath = path.resolve(args.projectDir, 'package.json')
  try {
    const packageObj = await fse.readJson(packageJsonPath)

    packageObj.dependencies['payload'] = '^2.0.0'

    const dbPackage = dbPackages[args.dbDetails.type]
    const bundlerPackage = bundlerPackages['webpack']
    const editorPackage = editorPackages['lexical']

    // Delete all other db adapters
    Object.values(dbPackages).forEach((p) => {
      if (p.packageName !== dbPackage.packageName) {
        delete packageObj.dependencies[p.packageName]
      }
    })

    packageObj.dependencies[dbPackage.packageName] = dbPackage.version
    packageObj.dependencies[bundlerPackage.packageName] = bundlerPackage.version
    packageObj.dependencies[editorPackage.packageName] = editorPackage.version

    await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
  } catch (err: unknown) {
    warning(`Unable to configure Payload in package.json`)
    warning(err instanceof Error ? err.message : '')
  }

  try {
    const possiblePaths = [
      path.resolve(args.projectDir, 'src/payload.config.ts'),
      path.resolve(args.projectDir, 'src/payload/payload.config.ts'),
    ]

    let payloadConfigPath: string | undefined

    possiblePaths.forEach((p) => {
      if (fse.pathExistsSync(p) && !payloadConfigPath) {
        payloadConfigPath = p
      }
    })

    if (!payloadConfigPath) {
      warning('Unable to update payload.config.ts with plugins')
      return
    }

    const configContent = fse.readFileSync(payloadConfigPath, 'utf-8')
    const configLines = configContent.split('\n')

    const dbReplacement = dbPackages[args.dbDetails.type]
    const bundlerReplacement = bundlerPackages['webpack']
    const editorReplacement = editorPackages['slate']

    let dbConfigStartLineIndex: number | undefined
    let dbConfigEndLineIndex: number | undefined

    configLines.forEach((l, i) => {
      if (l.includes('// database-adapter-import')) {
        configLines[i] = dbReplacement.importReplacement
      }
      if (l.includes('// bundler-import')) {
        configLines[i] = bundlerReplacement.importReplacement
      }

      if (l.includes('// bundler-config')) {
        configLines[i] = bundlerReplacement.configReplacement
      }

      if (l.includes('// editor-import')) {
        configLines[i] = editorReplacement.importReplacement
      }

      if (l.includes('// editor-config')) {
        configLines[i] = editorReplacement.configReplacement
      }

      if (l.includes('// database-adapter-config-start')) {
        dbConfigStartLineIndex = i
      }
      if (l.includes('// database-adapter-config-end')) {
        dbConfigEndLineIndex = i
      }
    })

    if (!dbConfigStartLineIndex || !dbConfigEndLineIndex) {
      warning('Unable to update payload.config.ts with database adapter import')
    } else {
      // Replaces lines between `// database-adapter-config-start` and `// database-adapter-config-end`
      configLines.splice(
        dbConfigStartLineIndex,
        dbConfigEndLineIndex - dbConfigStartLineIndex + 1,
        ...dbReplacement.configReplacement,
      )
    }

    fse.writeFileSync(payloadConfigPath, configLines.join('\n'))
  } catch (err: unknown) {
    warning('Unable to update payload.config.ts with plugins')
  }
}
