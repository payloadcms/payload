import globby from 'globby'
import minimist from 'minimist'
import path from 'path'
import shelljs from 'shelljs'
import slash from 'slash'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

shelljs.env.DISABLE_LOGGING = 'true'

const prod = process.argv.includes('--prod')
process.argv = process.argv.filter((arg) => arg !== '--prod')
if (prod) {
  process.env.PAYLOAD_TEST_PROD = 'true'
  shelljs.env.PAYLOAD_TEST_PROD = 'true'
}

const playwrightBin = path.resolve(dirname, '../node_modules/.bin/playwright')

const testRunCodes: { code: number; suiteName: string }[] = []
const { _: args, bail, part } = minimist(process.argv.slice(2))
const suiteName = args[0]

// Run all
if (!suiteName) {
  let files = await globby(`${path.resolve(dirname).replace(/\\/g, '/')}/**/*e2e.spec.ts`)

  const totalFiles = files.length

  if (part) {
    if (!part.includes('/')) {
      throw new Error('part must be in the format of "1/2"')
    }

    const [partToRun, totalParts] = part.split('/').map((n) => parseInt(n))

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

  files.forEach((file) => {
    clearWebpackCache()
    executePlaywright(file, bail)
  })
} else {
  // Run specific suite
  clearWebpackCache()
  const suitePath = path.resolve(dirname, suiteName, 'e2e.spec.ts').replaceAll('__', '/')
  executePlaywright(suitePath)
}

console.log('\nRESULTS:')
testRunCodes.forEach((tr) => {
  console.log(`\tSuite: ${tr.suiteName}, Success: ${tr.code === 0}`)
})
console.log('\n')

if (testRunCodes.some((tr) => tr.code > 0)) process.exit(1)

function executePlaywright(suitePath: string, bail = false) {
  console.log(`Executing ${suitePath}...`)
  const playwrightCfg = path.resolve(
    dirname,
    `${bail ? 'playwright.bail.config.ts' : 'playwright.config.ts'}`,
  )

  const cmd = slash(`${playwrightBin} test ${suitePath} -c ${playwrightCfg}`)
  console.log('\n', cmd)
  const { code, stdout } = shelljs.exec(cmd)
  const suite = path.basename(path.dirname(suitePath))
  const results = { code, suiteName: suite }
  if (code) {
    if (bail) {
      console.error(`TEST FAILURE DURING ${suite} suite.`)
      process.exit(1)
    }
  }
  testRunCodes.push(results)
  return stdout
}

function clearWebpackCache() {
  const webpackCachePath = path.resolve(dirname, '../node_modules/.cache/webpack')
  shelljs.rm('-rf', webpackCachePath)
}
