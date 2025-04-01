import type { ImportMap, Payload, SanitizedConfig } from 'payload'

import { spawn } from 'child_process'
import { ensureCompilationIsDone } from 'helpers.js'
import path from 'path'
import { getPayload } from 'payload'
import { wait } from 'payload/shared'

import { runInit } from '../runInit.js'
import { NextRESTClient } from './NextRESTClient.js'

let child

process.on('close', () => {
  if (child) {
    child.kill('close')
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  if (child) {
    child.kill('SIGINT')
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  if (child) {
    child.kill('SIGINT')
  }
  process.exit(0) // Exit the parent process
})

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt({
  dirname,
  testSuiteNameOverride,
  initializePayload = true,
  startNext = false,
}: {
  dirname: string
  initializePayload?: boolean
  startNext?: boolean
  testSuiteNameOverride?: string
}): Promise<{ config: SanitizedConfig; payload?: Payload; restClient?: NextRESTClient }> {
  const testSuiteName = testSuiteNameOverride ?? path.basename(dirname)

  let importMap: ImportMap | undefined = undefined

  const { default: unsanitizedConfig } = await import(path.resolve(dirname, 'config.ts'))

  const config = (await unsanitizedConfig) as SanitizedConfig

  if (startNext) {
    const spawnDevArgs: string[] = ['dev', testSuiteName, '--start-memory-db', '--prod']

    child = spawn('pnpm', spawnDevArgs, {
      stdio: 'inherit',
      cwd: path.resolve(dirname, '..', '..'),
      env: {
        ...process.env,
      },
    })

    const adminURL = `http://localhost:3000${config.routes.admin}`

    const maxAttempts = 50
    let attempt = 1

    while (attempt <= maxAttempts) {
      try {
        console.log(
          `Checking if compilation is done (attempt ${attempt}/${maxAttempts})...`,
          adminURL,
        )

        const res = await fetch(`${adminURL}/login`)

        if (res.status === 200) {
          console.log('Compilation done!')
          break
        }
      } catch (error) {
        console.error(`Compilation not done yet`)

        if (attempt === maxAttempts) {
          console.error('Max retry attempts reached. Giving up.')
          throw error
        }

        console.log('Retrying in 3 seconds...')
        await wait(3000)
        attempt++
      }
    }

    ;({ importMap } = await import(
      path.resolve(dirname, '..', 'app', '(payload)', 'admin', 'importMap.js')
    ))
  }

  await runInit(testSuiteName, false, true)

  console.log('Importing config', path.resolve(dirname, 'config.ts'))

  if (!initializePayload) {
    return { config }
  }

  console.log('Starting Payload')

  const payload = await getPayload({ config, importMap })

  console.log('Initializing REST client')

  const restClient = new NextRESTClient(payload.config)

  console.log('InitPayloadInt done')

  return { config: payload.config, payload, restClient }
}
