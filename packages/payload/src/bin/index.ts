// @ts-strict-ignore
/* eslint-disable no-console */
import { Cron } from 'croner'
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import path from 'path'

import { findConfig } from '../config/find.js'
import payload, { getPayload } from '../index.js'
import { drizzleStudio } from './drizzleStudio.js'
import { generateImportMap } from './generateImportMap/index.js'
import { generateTypes } from './generateTypes.js'
import { info } from './info.js'
import { loadEnv } from './loadEnv.js'
import { migrate, availableCommands as migrateCommands } from './migrate.js'

// Note: this does not account for any user bin scripts
const availableScripts = [
  'drizzle:studio',
  'generate:db-schema',
  'generate:importmap',
  'generate:types',
  'info',
  'jobs:run',
  'run',
  ...migrateCommands,
] as const

export const bin = async () => {
  loadEnv()

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  if (script === 'info') {
    await info()
    return
  }

  if (script === 'run') {
    const scriptPath = args._[1]
    if (!scriptPath) {
      console.error('Please provide a script path to run.')
      process.exit(1)
    }

    const absoluteScriptPath = path.resolve(process.cwd(), scriptPath)

    // Modify process.argv to remove 'run' and the script path
    const originalArgv = process.argv
    process.argv = [process.argv[0]!, process.argv[1]!, ...args._.slice(2)]

    try {
      await import(pathToFileURL(absoluteScriptPath).toString())
    } catch (error) {
      console.error(`Error running script: ${absoluteScriptPath}`)
      console.error(error)
      process.exit(1)
    } finally {
      // Restore original process.argv
      process.argv = originalArgv
    }
    return
  }

  // Auto-compile workspace packages if drizzle:studio command before loading config
  if (script === 'drizzle:studio') {
    try {
      const { execSync } = await import('child_process')
      const fs = await import('fs')
      const path = await import('path')

      // Check if we have workspace packages that need building
      const workspacePackages = [
        '@payloadcms/drizzle',
        '@payloadcms/db-postgres',
        '@payloadcms/translations',
        'payload',
      ]
      const packagesToBuild = []

      // Check if we're in a workspace environment
      const isWorkspace = fs.existsSync(path.join(process.cwd(), 'packages'))

      if (isWorkspace) {
        for (const pkgName of workspacePackages) {
          try {
            // Map package names to their workspace directory paths
            const pkgDirMap: Record<string, string> = {
              '@payloadcms/db-postgres': 'packages/db-postgres',
              '@payloadcms/drizzle': 'packages/drizzle',
              '@payloadcms/translations': 'packages/translations',
              payload: 'packages/payload',
            }

            const pkgPath = pkgDirMap[pkgName]
            if (!pkgPath) {
              console.log(`Debug: Unknown package ${pkgName}, skipping`)
              continue
            }

            const pkgDir = path.join(process.cwd(), pkgPath)
            const pkgJsonPath = path.join(pkgDir, 'package.json')

            if (fs.existsSync(pkgJsonPath)) {
              // Check if dist directory exists and has required files
              const distDir = path.join(pkgDir, 'dist')
              const hasCompiledFiles = fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0

              if (!hasCompiledFiles) {
                if (pkgName === '@payloadcms/drizzle') {
                  packagesToBuild.push('build:drizzle')
                }
                if (pkgName === '@payloadcms/db-postgres') {
                  packagesToBuild.push('build:db-postgres')
                }
                if (pkgName === '@payloadcms/translations') {
                  packagesToBuild.push('build:translations')
                }
                if (pkgName === 'payload') {
                  packagesToBuild.push('build:payload')
                }
              }
            }
          } catch (err) {
            // Silent error handling - package may not exist or be malformed
          }
        }
      }

      if (packagesToBuild.length > 0) {
        console.log('Building required workspace packages for Drizzle Studio...')

        execSync(`pnpm ${packagesToBuild.join(' && pnpm ')}`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        })
      }

      // Temporarily modify workspace package exports to use dist/ for drizzle:studio
      const originalConfigs = new Map<string, string>()

      for (const pkgName of workspacePackages) {
        const pkgDirMap: Record<string, string> = {
          '@payloadcms/db-postgres': 'packages/db-postgres',
          '@payloadcms/drizzle': 'packages/drizzle',
          '@payloadcms/translations': 'packages/translations',
          payload: 'packages/payload',
        }

        const pkgPath = pkgDirMap[pkgName]
        if (!pkgPath) {continue}

        const pkgDir = path.join(process.cwd(), pkgPath)
        const pkgJsonPath = path.join(pkgDir, 'package.json')

        if (fs.existsSync(pkgJsonPath)) {
          const originalConfig = fs.readFileSync(pkgJsonPath, 'utf8')
          originalConfigs.set(pkgJsonPath, originalConfig)

          const config = JSON.parse(originalConfig)

          // Modify exports to use dist/
          if (config.exports) {
            Object.keys(config.exports).forEach((key) => {
              if (config.exports[key].import) {
                config.exports[key].import = config.exports[key].import
                  .replace('/src/', '/dist/')
                  .replace('.ts', '.js')
                config.exports[key].types = config.exports[key].types
                  .replace('/src/', '/dist/')
                  .replace('.ts', '.d.ts')
                config.exports[key].default = config.exports[key].default
                  .replace('/src/', '/dist/')
                  .replace('.ts', '.js')
              }
            })
          }
          if (config.main) {
            config.main = config.main.replace('/src/', '/dist/').replace('.ts', '.js')
          }
          if (config.types) {
            config.types = config.types.replace('/src/', '/dist/').replace('.ts', '.d.ts')
          }

          fs.writeFileSync(pkgJsonPath, JSON.stringify(config, null, 2))
        }
      }

      // Store original configs for restoration
      process.env.__DRIZZLE_STUDIO_ORIGINAL_CONFIGS = JSON.stringify(
        Array.from(originalConfigs.entries()),
      )
    } catch (error) {
      console.warn(
        'Could not build workspace packages automatically. If you encounter import errors, try running the build commands manually.',
      )
      console.error(error)
    }
  }

  const configPath = findConfig()
  const configPromise = await import(pathToFileURL(configPath).toString())
  let config = await configPromise
  if (config.default) {
    config = await config.default
  }

  const userBinScript = Array.isArray(config.bin)
    ? config.bin.find(({ key }: { key: string }) => key === script)
    : false

  if (userBinScript) {
    try {
      const module = await import(pathToFileURL(userBinScript.scriptPath).toString())

      if (!module.script || typeof module.script !== 'function') {
        console.error(
          `Could not find "script" function export for script ${userBinScript.key} in ${userBinScript.scriptPath}`,
        )
      } else {
        await module.script(config).catch((err: unknown) => {
          console.log(`Script ${userBinScript.key} failed, details:`)
          console.error(err)
        })
      }
    } catch (err) {
      console.log(`Could not find associated bin script for the ${userBinScript.key} command`)
      console.error(err)
    }

    return
  }

  if (script.startsWith('migrate')) {
    return migrate({ config, parsedArgs: args }).then(() => process.exit(0))
  }

  if (script === 'drizzle:studio') {
    return drizzleStudio(config)
  }

  if (script === 'generate:types') {
    return generateTypes(config)
  }

  if (script === 'generate:importmap') {
    return generateImportMap(config)
  }

  if (script === 'jobs:run') {
    const payload = await getPayload({ config })
    const limit = args.limit ? parseInt(args.limit, 10) : undefined
    const queue = args.queue ? args.queue : undefined
    const allQueues = !!args.allQueues

    if (args.cron) {
      new Cron(args.cron, async () => {
        await payload.jobs.run({
          allQueues,
          limit,
          queue,
        })
      })

      process.stdin.resume() // Keep the process alive

      return
    } else {
      await payload.jobs.run({
        allQueues,
        limit,
        queue,
      })

      await payload.destroy() // close database connections after running jobs so process can exit cleanly

      return
    }
  }

  if (script === 'generate:db-schema') {
    // Barebones instance to access database adapter, without connecting to the DB
    await payload.init({
      config,
      disableDBConnect: true,
      disableOnInit: true,
    })

    if (typeof payload.db.generateSchema !== 'function') {
      payload.logger.error({
        msg: `${payload.db.packageName} does not support database schema generation`,
      })

      process.exit(1)
    }

    await payload.db.generateSchema({
      log: args.log === 'false' ? false : true,
      prettify: args.prettify === 'false' ? false : true,
    })

    process.exit(0)
  }

  console.error(script ? `Unknown command: "${script}"` : 'Please provide a command to run')
  console.log(`\nAvailable commands:\n${availableScripts.map((c) => `  - ${c}`).join('\n')}`)

  process.exit(1)
}
