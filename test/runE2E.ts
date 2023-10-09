import glob from 'glob'
import path from 'path'
import shelljs from 'shelljs'
import slash from 'slash'

shelljs.env.DISABLE_LOGGING = 'true'

const playwrightBin = path.resolve(__dirname, '../node_modules/.bin/playwright')

const testRunCodes: { code: number; suiteName: string }[] = []
const args = process.argv.slice(2)
const suiteName = args[0]

// Run all
if (!suiteName || args[0].startsWith('-')) {
  const bail = args.includes('--bail')
  const files = glob.sync(`${path.resolve(__dirname).replace(/\\/g, '/')}/**/*e2e.spec.ts`)
  console.log(`\n\nExecuting all ${files.length} E2E tests...`)
  files.forEach((file) => {
    clearWebpackCache()
    executePlaywright(file, bail)
  })
} else {
  // Run specific suite
  clearWebpackCache()
  const suitePath = path.resolve(__dirname, suiteName, 'e2e.spec.ts')
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
    __dirname,
    '..',
    `${bail ? 'playwright.bail.config.ts' : 'playwright.config.ts'}`,
  )

  const cmd = slash(`${playwrightBin} test ${suitePath} -c ${playwrightCfg}`)
  console.log('\n', cmd)
  const { stdout, code } = shelljs.exec(cmd)
  const suite = path.basename(path.dirname(suitePath))
  const results = { suiteName: suite, code }
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
  const webpackCachePath = path.resolve(__dirname, '../node_modules/.cache/webpack')
  shelljs.rm('-rf', webpackCachePath)
}
