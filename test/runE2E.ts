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
  'grep-invert': grepInvert,
  headed,
  part,
  shard,
  'update-snapshots': updateSnapshots,
  workers,
} = minimist(process.argv.slice(2), { alias: { g: 'grep' } })
const suiteName = args[0]

// `@visual` screenshot comparisons only run against a real production build (see
// `expectScreenshot`) and are opted into explicitly, via `--grep @visual`, by the dedicated
// visual-regression CI job and `pnpm test:visual`. Exclude them by default so the
// plain dev-server run (`pnpm test:e2e` / `pnpm test`) doesn't hit `expectScreenshot`'s
// production-build check.
const effectiveGrepInvert = grepInvert ?? (grep === '@visual' ? undefined : '@visual')

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
    await executePlaywright({
      bail,
      baseTestFolder,
      grepInvertArg: effectiveGrepInvert,
      headedArg: headed,
      suitePaths: file,
      updateSnapshotsArg: updateSnapshots,
    })
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
  await executePlaywright({
    baseTestFolder,
    fullyParallelArg: fullyParallel,
    grepArg: grep,
    grepInvertArg: effectiveGrepInvert,
    headedArg: headed,
    shardArg: shard,
    suiteConfigPath,
    suitePaths: allSuitesInFolder,
    updateSnapshotsArg: updateSnapshots,
    workersArg: workers,
  })
}

console.log('\nRESULTS:')
testRunCodes.forEach((tr) => {
  console.log(`\tSuite: ${tr.suiteName}, Success: ${tr.code === 0}`)
})
console.log('\n')

// baseTestFolder is the most top level folder of the test suite, that contains the payload config.
// We need this because pnpm dev for a given test suite will always be run from the top level test folder,
// not from a nested suite folder.
async function executePlaywright({
  bail = false,
  baseTestFolder,
  fullyParallelArg,
  grepArg,
  grepInvertArg,
  headedArg,
  shardArg,
  suiteConfigPath,
  suitePaths,
  updateSnapshotsArg,
  workersArg,
}: {
  bail?: boolean
  baseTestFolder: string
  fullyParallelArg?: boolean
  grepArg?: string
  grepInvertArg?: string
  headedArg?: boolean
  shardArg?: string
  suiteConfigPath?: string
  suitePaths: string | string[]
  updateSnapshotsArg?: boolean
  workersArg?: number
}) {
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
      // Makes this process the leader of its own process group, so `stopServer` can signal every
      // descendant it spawns (pnpm -> a shell -> cross-env -> tsx -> the actual Next.js server)
      // by targeting the group instead of just this one PID, which by itself never reaches the
      // real server process running several layers down.
      detached: true,
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
  const grepInvertFlag = grepInvertArg ? ` --grep-invert="${grepInvertArg}"` : ''
  const headedFlag = headedArg ? ' --headed' : ''
  const updateSnapshotsFlag = updateSnapshotsArg ? ' --update-snapshots' : ''
  const cmd = slash(
    `${playwrightBin} test ${paths.join(' ')} -c ${playwrightCfg}${shardFlag}${fullyParallelFlag}${workersFlag}${grepFlag}${grepInvertFlag}${headedFlag}${updateSnapshotsFlag}`,
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
    await stopServer(child)
    process.exit(1)
  } else {
    await stopServer(child)
  }
  testRunCodes.push(results)

  return stdout
}

function clearWebpackCache() {
  const webpackCachePath = path.resolve(dirname, '../node_modules/.cache/webpack')
  shelljs.rm('-rf', webpackCachePath)
}

/**
 * Waits for the spawned server to fully exit before resolving, instead of firing the kill signal
 * and moving on. Without this, a caller that runs several suites back-to-back (each against its
 * own config, bound to the same port) can start the next suite's port-in-use check before this
 * server has actually released the port — that next suite then silently reuses the still-dying
 * server from the wrong suite instead of starting its own.
 */
async function stopServer(serverChild: ReturnType<typeof spawn> | undefined): Promise<void> {
  if (!serverChild || serverChild.exitCode !== null || !serverChild.pid) {
    return
  }

  // Negative PID targets the whole process group `spawn`'s `detached: true` made this process the
  // leader of, not just this one PID — see the comment where it's spawned. Already exited by the
  // time this fires is the expected, common case (ESRCH), not an error.
  const killGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-serverChild.pid!, signal)
    } catch {
      // Already exited — nothing left to signal.
    }
  }

  await new Promise<void>((resolve) => {
    const killTimer = setTimeout(() => killGroup('SIGKILL'), 15000)

    serverChild.once('exit', () => {
      clearTimeout(killTimer)
      resolve()
    })

    killGroup('SIGTERM')
  })
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
