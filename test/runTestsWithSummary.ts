import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Hardcoded list of test suites to run
// Comment out any suites you want to exclude
const TEST_SUITES = [
  '_community',
  'access-control',
  'admin-root',
  'array-update',
  'auth',
  'collections-graphql',
  'collections-rest',
  'config',
  //   'create-payload-app', unrelated with content api
  'custom-graphql',
  'database',
  'dataloader',
  'endpoints',
  //   'fields', very slow, run separately
  'fields-relationship',
  'folders',
  'folders-browse-by-disabled',
  'form-state',
  'globals',
  'graphql',
  'hooks',
  //   'joins', not supported yet in content api
  'kv',
  'lexical-mdx',
  'live-preview',
  'loader',
  //   'localization', We do not plan to support before EOY.
  'locked-documents',
  'login-with-username',
  'payload-cloud',
  'plugin-cloud-storage',
  'plugin-ecommerce',
  'plugin-form-builder',
  'plugin-import-export',
  'plugin-mcp',
  'plugin-multi-tenant',
  'plugin-nested-docs',
  'plugin-redirects',
  'plugin-search',
  'plugin-sentry',
  'plugin-seo',
  'plugin-stripe',
  'plugins',
  'query-presets',
  'queues',
  'relationships',
  'sdk',
  //   'select',  We do not plan to support before EOY.
  'sort',
  'storage-azure',
  'storage-s3',
  'trash',
  'uploads',
  'versions',
]

interface SuiteResult {
  duration: number
  failed: boolean
  name: string
  passed: number
  total: number
}

function getTestDirectories(): string[] {
  const testDir = dirname

  // Filter the hardcoded list to only include suites that actually exist
  return TEST_SUITES.filter((suiteName) => {
    const intSpecPath = path.join(testDir, suiteName, 'int.spec.ts')
    const exists = fs.existsSync(intSpecPath)
    if (!exists) {
      console.warn(`⚠️  Warning: Suite '${suiteName}' listed but int.spec.ts not found`)
    }
    return exists
  })
}

function parseTestResults(output: string): { passed: number; total: number } {
  let passed = 0
  let total = 0

  // First, get total executed tests from "Executed X of Y"
  const executedPattern = /Executed\s+(\d+)\s+of\s+(\d+)/
  const executedMatch = output.match(executedPattern)

  if (executedMatch && executedMatch[1] && executedMatch[2]) {
    total = parseInt(executedMatch[2], 10)
  }

  // Now check the TOTAL line for pass/fail counts
  // Format: "TOTAL: X SUCCESS" or "TOTAL: X FAILED" or "TOTAL: X SUCCESS Y FAILED"

  const totalSuccessPattern = /TOTAL:\s+(\d+)\s+SUCCESS/
  const totalFailedPattern = /TOTAL:\s+(\d+)\s+FAILED/

  const successMatch = output.match(totalSuccessPattern)
  const failedMatch = output.match(totalFailedPattern)

  if (successMatch && successMatch[1]) {
    passed = parseInt(successMatch[1], 10)

    // If we also have failures, calculate total
    if (failedMatch && failedMatch[1]) {
      const failed = parseInt(failedMatch[1], 10)
      total = passed + failed
    } else {
      // All tests passed
      total = passed
    }

    return { passed, total }
  }

  // If only FAILED in TOTAL (no success count), calculate passed from total - failed
  if (failedMatch && failedMatch[1] && total > 0) {
    const failed = parseInt(failedMatch[1], 10)
    passed = total - failed
    return { passed, total }
  }

  // Fallback to standard Jest patterns
  // Try to match: "Tests: X passed, Y total" or "Tests: X failed, Y passed, Z total"
  const testsPattern1 = /Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/
  const testsPattern2 = /Tests:\s+\d+\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/
  const testsPattern3 = /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+total/

  let match2 = output.match(testsPattern2)
  if (match2 && match2[1] && match2[2]) {
    passed = parseInt(match2[1], 10)
    total = parseInt(match2[2], 10)
    return { passed, total }
  }

  match2 = output.match(testsPattern1)
  if (match2 && match2[1] && match2[2]) {
    passed = parseInt(match2[1], 10)
    total = parseInt(match2[2], 10)
    return { passed, total }
  }

  match2 = output.match(testsPattern3)
  if (match2 && match2[1] && match2[2]) {
    const failed = parseInt(match2[1], 10)
    total = parseInt(match2[2], 10)
    passed = total - failed
    return { passed, total }
  }

  // Try simpler patterns without "Tests:" prefix
  const simplePattern1 = /(\d+)\s+passed,\s+(\d+)\s+total/
  const simplePattern2 = /\d+\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/

  match2 = output.match(simplePattern2)
  if (match2 && match2[1] && match2[2]) {
    passed = parseInt(match2[1], 10)
    total = parseInt(match2[2], 10)
    return { passed, total }
  }

  match2 = output.match(simplePattern1)
  if (match2 && match2[1] && match2[2]) {
    passed = parseInt(match2[1], 10)
    total = parseInt(match2[2], 10)
    return { passed, total }
  }

  // Try to find individual counts
  const passedMatch2 = output.match(/(\d+)\s+passed/)
  const failedMatch2 = output.match(/(\d+)\s+failed/)

  if (passedMatch2 && passedMatch2[1]) {
    passed = parseInt(passedMatch2[1], 10)
  }

  if (failedMatch2 && failedMatch2[1]) {
    const failed = parseInt(failedMatch2[1], 10)
    total = passed + failed
    return { passed, total }
  }

  if (passed > 0) {
    total = passed
  }

  return { passed, total }
}

function runTestSuite(suiteName: string): SuiteResult {
  const startTime = Date.now()
  const result: SuiteResult = {
    name: suiteName,
    passed: 0,
    total: 0,
    failed: false,
    duration: 0,
  }

  try {
    const testPath = path.join(dirname, suiteName, 'int.spec.ts')
    const command = `cross-env NODE_OPTIONS="--no-deprecation --no-experimental-strip-types" NODE_NO_WARNINGS=1 DISABLE_LOGGING=true jest --forceExit --detectOpenHandles --config=test/jest.config.js --runInBand ${testPath}`

    const output = execSync(command, {
      cwd: path.join(dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Parse Jest output to extract test counts
    const parsed = parseTestResults(output)
    result.passed = parsed.passed
    result.total = parsed.total
  } catch (error: unknown) {
    // Try to parse failure output from both stdout and stderr
    let errorOutput = ''
    if (error && typeof error === 'object') {
      if ('stdout' in error) {
        const stdout = (error as { stdout?: unknown }).stdout
        if (typeof stdout === 'string') {
          errorOutput += stdout
        } else if (stdout && Buffer.isBuffer(stdout)) {
          errorOutput += stdout.toString('utf8')
        }
      }
      if ('stderr' in error) {
        const stderr = (error as { stderr?: unknown }).stderr
        if (typeof stderr === 'string') {
          errorOutput += '\n' + stderr
        } else if (stderr && Buffer.isBuffer(stderr)) {
          errorOutput += '\n' + stderr.toString('utf8')
        }
      }
    }

    const parsed = parseTestResults(errorOutput)
    result.passed = parsed.passed
    result.total = parsed.total

    // Only mark as failed if tests actually failed (not all passed)
    // Some tests may exit with error code even if all tests pass
    result.failed = result.passed < result.total
  }

  result.duration = Date.now() - startTime
  return result
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function main() {
  console.log('🧪 Running integration tests suite by suite...\n')

  const testDirs = getTestDirectories()
  console.log(`Found ${testDirs.length} test suites\n`)

  const results: SuiteResult[] = []
  const overallStart = Date.now()

  for (let i = 0; i < testDirs.length; i++) {
    const suiteName = testDirs[i]
    if (!suiteName) {
      continue
    }

    process.stdout.write(`[${i + 1}/${testDirs.length}] Running ${suiteName}... `)

    const result = runTestSuite(suiteName)
    results.push(result)

    let statusIcon = '✅'
    if (result.failed || result.passed < result.total) {
      if (result.passed === 0) {
        statusIcon = '❌'
      } else {
        statusIcon = '⚠️'
      }
    }

    const statusText = `${statusIcon} ${result.passed}/${result.total} (${formatDuration(result.duration)})`
    console.log(statusText)
  }

  const overallDuration = Date.now() - overallStart

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80) + '\n')

  const maxNameLength = Math.max(...results.map((r) => r.name.length))
  const maxTestCountLength = Math.max(...results.map((r) => `${r.passed}/${r.total}`.length))

  for (const result of results) {
    let statusIcon = '✅'
    if (result.failed || result.passed < result.total) {
      if (result.passed === 0) {
        statusIcon = '❌'
      } else {
        statusIcon = '⚠️'
      }
    }

    const paddedName = result.name.padEnd(maxNameLength)
    const testCount = `${result.passed}/${result.total}`.padEnd(maxTestCountLength)
    const duration = formatDuration(result.duration)
    console.log(`${statusIcon} ${paddedName}  ${testCount}  ${duration}`)
  }

  console.log('\n' + '='.repeat(80))

  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
  const totalTests = results.reduce((sum, r) => sum + r.total, 0)
  const failedOrPartialSuites = results.filter((r) => r.failed || r.passed < r.total)
  const passedSuites = results.length - failedOrPartialSuites.length

  console.log(`\n📈 Overall Results:`)
  console.log(`   Suites: ${passedSuites}/${results.length} passed`)
  console.log(`   Tests:  ${totalPassed}/${totalTests} passed`)
  console.log(`   Time:   ${formatDuration(overallDuration)}`)
  console.log()

  if (failedOrPartialSuites.length > 0) {
    console.log('❌ Failed or partially failed suites:')
    failedOrPartialSuites.forEach((r) => {
      const icon = r.passed === 0 ? '❌' : '⚠️'
      console.log(`   ${icon} ${r.name} (${r.passed}/${r.total})`)
    })
    process.exit(1)
  } else {
    console.log('✅ All test suites passed!')
    process.exit(0)
  }
}

try {
  main()
} catch (error) {
  console.error('Error running tests:', error)
  process.exit(1)
}
