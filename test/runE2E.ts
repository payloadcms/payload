import { spawn } from 'child_process'
import globby from 'globby'
import minimist from 'minimist'
import { createServer } from 'net'
import path from 'path'
import shelljs from 'shelljs'
import slash from 'slash'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

shelljs.env.DISABLE_LOGGING = 'true'

// --prod-server boots a real production server (next build / vite build) per suite
// against the packed dist packages. Without it, the dev server runs against source.
const prodServer = process.argv.includes('--prod-server')
if (prodServer) {
  process.env.PAYLOAD_TEST_PROD = 'true'
  shelljs.env.PAYLOAD_TEST_PROD = 'true'
}

const turbo = process.argv.includes('--no-turbo') ? false : true

process.argv = process.argv.filter((arg) => arg !== '--prod-server' && arg !== '--no-turbo')

const playwrightBin = path.resolve(dirname, '../node_modules/.bin/playwright')

const testRunCodes: { code: number; suiteName: string }[] = []
const {
  _: args,
  bail,
  'fully-parallel': fullyParallel,
  grep,
  headed,
  part,
  shard,
  workers,
} = minimist(process.argv.slice(2), { alias: { g: 'grep' } })
const suiteName = args[0]

// Run all
if (!suiteName) {
  let files = await globby(`${path.resolve(dirname).replace(/\\/g, '/')}/**/*e2e.spec.ts`)

  const totalFiles = files.length

  if (part) {
    if (!part.includes('/')) {
      throw new Error('part must be in the format of "1/2"')
    }

    const [partToRun, totalParts] = part.split('/').map((n: string) => parseInt(n))

    if (partToRun > totalParts) {
      throw new Error('part cannot be greater than totalParts')
    }

    const partSize = Math.ceil(files.length / totalParts)
    const start = (partToRun - 1) * partSize
    const end = start + partSize
    files = files.slice(start, end)
  }

  if (files.length !== totalFiles) {
    console.log(`\n\nExecuting part ${part}: ${files.length} of ${totalFiles} E2E tests...\n\n`)
  } else {
    console.log(`\n\nExecuting all ${files.length} E2E tests...\n\n`)
  }
  console.log(`${files.join('\n')}\n`)

  for (const file of files) {
    clearWebpackCache()

    const baseTestFolder = file?.split('/test/')?.[1]?.split('/')?.[0]
    if (!baseTestFolder) {
      throw new Error(`No base test folder found for ${file}`)
    }
    await executePlaywright(
      file,
      baseTestFolder,
      bail,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      headed,
    )
  }
} else {
  let inputSuitePath: string | undefined = suiteName
  let suiteConfigPath: string | undefined = 'config.ts'
  if (suiteName.includes('#')) {
    ;[inputSuitePath, suiteConfigPath] = suiteName.split('#')
  }

  if (!inputSuitePath) {
    throw new Error(`No test suite found for ${suiteName}`)
  }

  // Run specific suite
  clearWebpackCache()
  const suiteFolderPath: string | undefined = path
    .resolve(dirname, inputSuitePath)
    .replaceAll('__', '/')

  const allSuitesInFolder = await globby(`${suiteFolderPath.replace(/\\/g, '/')}/*e2e.spec.ts`)

  const baseTestFolder = inputSuitePath.split('__')[0]

  if (!baseTestFolder || !allSuitesInFolder?.length) {
    throw new Error(`No test suite found for ${suiteName}`)
  }

  console.log(`\n\nExecuting all ${allSuitesInFolder.length} E2E tests...\n\n`)

  console.log(`${allSuitesInFolder.join('\n')}\n`)

  // Run all spec files in the folder with a single dev server and playwright invocation
  // This avoids port conflicts when multiple spec files exist in the same folder
  await executePlaywright(
    allSuitesInFolder,
    baseTestFolder,
    false,
    suiteConfigPath,
    shard,
    fullyParallel,
    workers,
    grep,
    headed,
  )
}

console.log('\nRESULTS:')
testRunCodes.forEach((tr) => {
  console.log(`\tSuite: ${tr.suiteName}, Success: ${tr.code === 0}`)
})
console.log('\n')

// baseTestFolder is the most top level folder of the test suite, that contains the payload config.
// We need this because pnpm dev for a given test suite will always be run from the top level test folder,
// not from a nested suite folder.
async function executePlaywright(
  suitePaths: string | string[],
  baseTestFolder: string,
  bail = false,
  suiteConfigPath?: string,
  shardArg?: string,
  fullyParallelArg?: boolean,
  workersArg?: number,
  grepArg?: string,
  headedArg?: boolean,
) {
  const paths = Array.isArray(suitePaths) ? suitePaths : [suitePaths]
  console.log(`Executing ${paths.join(', ')}...`)
  const playwrightCfg = path.resolve(
    dirname,
    `${bail ? 'playwright.bail.config.ts' : 'playwright.config.ts'}`,
  )

  const spawnDevArgs: string[] = [
    'dev',
    suiteConfigPath ? `${baseTestFolder}#${suiteConfigPath}` : baseTestFolder,
  ]
  if (prodServer) {
    spawnDevArgs.push('--prod-server')
  }

  if (!turbo) {
    spawnDevArgs.push('--no-turbo')
  }

  process.env.START_MEMORY_DB = 'true'

  const e2ePort = process.env.PORT ? Number(process.env.PORT) : 3000

  const portInUse = await new Promise<boolean>((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => server.close(() => resolve(false)))
    server.listen(e2ePort)
  })

  let child: ReturnType<typeof spawn> | undefined

  if (portInUse) {
    console.log(`Port ${e2ePort} is already in use — reusing existing dev server.`)
  } else {
    child = spawn('pnpm', spawnDevArgs, {
      cwd: path.resolve(dirname, '..'),
      env: {
        ...process.env,
      },
      stdio: 'inherit',
    })
  }

  // A prod server only starts listening after the build/init completes, which outlasts Playwright's navigation timeout.
  // Wait for it before running tests.
  // (The dev server compiles routes lazily, so it needs no upfront wait.)
  if (prodServer && !portInUse) {
    await waitForServer(e2ePort)
  }

  const shardFlag = shardArg ? ` --shard=${shardArg}` : ''
  const fullyParallelFlag = fullyParallelArg ? ' --fully-parallel' : ''
  const workersFlag = workersArg !== undefined ? ` --workers=${workersArg}` : ''
  const grepFlag = grepArg ? ` --grep="${grepArg}"` : ''
  const headedFlag = headedArg ? ' --headed' : ''
  const cmd = slash(
    `${playwrightBin} test ${paths.join(' ')} -c ${playwrightCfg}${shardFlag}${fullyParallelFlag}${workersFlag}${grepFlag}${headedFlag}`,
  )
  console.log('\n', cmd)
  const { code, stdout } = shelljs.exec(cmd, {
    cwd: path.resolve(dirname, '..'),
  })
  const suite = path.basename(path.dirname(paths[0]!))
  const results = { code, suiteName: suite }

  if (code) {
    if (bail) {
      console.error(`TEST FAILURE DURING ${suite} suite.`)
    }
    child?.kill(1)
    process.exit(1)
  } else {
    child?.kill()
  }
  testRunCodes.push(results)

  return stdout
}

function clearWebpackCache() {
  const webpackCachePath = path.resolve(dirname, '../node_modules/.cache/webpack')
  shelljs.rm('-rf', webpackCachePath)
}

/**
 * Poll a port until the server responds, so Playwright doesn't start against a prod server that is still building.
 * Resolves on any HTTP response (the server only binds after the build/init finishes);
 * rejects if it never comes up.
 */
async function waitForServer(port: number, timeoutMs = 8 * 60 * 1000): Promise<void> {
  const url = `http://localhost:${port}/`
  const start = Date.now()
  console.log(`Waiting for prod server on ${url} …`)

  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url)
      console.log(`Prod server ready after ${Math.round((Date.now() - start) / 1000)}s`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw new Error(`Prod server did not start within ${timeoutMs / 1000}s`)
}
