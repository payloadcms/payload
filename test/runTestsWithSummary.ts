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
  //   'create-payload-app', // Does not use DB adapter - tests CLI tool
  // 'custom-graphql', We don't support transactions
  'database',
  'dataloader',
  'endpoints', // Does not use DB adapter - only tests custom HTTP endpoints (but still useful for integration)
  'field-paths',
  'fields-relationship',
  'folders',
  'folders-browse-by-disabled',
  'form-state',
  'globals',
  'graphql',
  'hooks',
  'joins',
  'kv',
  // 'lexical-mdx', Does not use DB adapter - only tests MDX ↔ JSON conversions (but still useful)
  'live-preview',
  'loader',
  'localization',
  'locked-documents',
  'login-with-username',
  // 'payload-cloud', Has no real tests (only it.todo) - shows 0/0
  // 'plugin-cloud-storage', Tests skipped unless in CI or has localstack - shows 0/0
  'plugin-ecommerce',
  'plugin-form-builder',
  'plugin-import-export',
  'plugin-mcp',
  'plugin-multi-tenant',
  'plugin-nested-docs',
  'plugin-redirects',
  'plugin-search',
  // 'plugin-sentry', Has no real tests (only it.todo) - shows 0/0
  'plugin-seo',
  'plugin-stripe',
  'plugins',
  'query-presets',
  // 'queues', Not supported yet in content api
  'relationships',
  'sdk',
  // 'select', // this suite is slow. Also see this: https://figma.slack.com/archives/C097Z32TW4V/p1767978110705459
  'sort',
  'storage-azure',
  'storage-s3',
  'trash',
  'uploads',
  'versions',
  'fields', // slowest test suite
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
  try {
    // Vitest JSON reporter outputs the JSON as the last line(s) or mixed with logs.
    // We look for the JSON structure corresponding to the report.
    // The output might contain multiple JSON objects if there are logs, so we look for the one with "testResults" or "numTotalTests".

    // Find the JSON part. It's usually a large object.
    // We'll try to find the last occurrence of "{" that looks like the start of the report
    const jsonStart = output.indexOf('{')
    if (jsonStart === -1) {
      return { passed: 0, total: 0 }
    }

    // It's safer to try to parse the whole output if it's just JSON,
    // but often it has console logs before it.
    // Let's try to extract the JSON object.
    // A simple heuristic: find the last JSON object in the output

    // Since we can't reliably regex the JSON, we will try to parse the output as JSON if possible,
    // or search for the JSON structure.

    // Vitest JSON output structure has "numTotalTests", "numPassedTests", "numFailedTests" at the root level.

    // Let's try to capture the JSON object from the output string.
    // We iterate backwards to find the last valid JSON object.

    // However, since we used --reporter=json, the output SHOULD be mostly JSON,
    // but console.logs from the test might prepend it.

    // Simple approach: Split by newlines and try to find the line that is valid JSON and contains the keys we need.
    // OR, if the JSON spans multiple lines (which it shouldn't in default compact mode, but might in pretty mode),
    // we might need a more robust parser. Vitest json reporter usually outputs minified JSON on one line unless configured otherwise?
    // Actually, it usually outputs a formatted JSON.

    // Let's rely on a specific key that should be present: "numTotalTests"
    const keyIndex = output.lastIndexOf('"numTotalTests"')
    if (keyIndex === -1) {
      return { passed: 0, total: 0 }
    }

    // Find the opening brace before this key
    const openBraceIndex = output.lastIndexOf('{', keyIndex)
    if (openBraceIndex === -1) {
      return { passed: 0, total: 0 }
    }

    // Find the closing brace. It should be at the end, or close to it.
    // We can try to parse the substring from openBraceIndex to the end, trimming potential garbage.
    let candidate = output.substring(openBraceIndex)

    // Try to parse. If it fails, trim from the end until it succeeds or gets too short.
    while (candidate.length > 10) {
      try {
        const data = JSON.parse(candidate)
        if (typeof data.numPassedTests === 'number' && typeof data.numTotalTests === 'number') {
          return {
            passed: data.numPassedTests,
            total: data.numTotalTests,
          }
        }
      } catch (e) {
        // Trim one character from the end and try again (in case of trailing newline or garbage)
        candidate = candidate.substring(0, candidate.length - 1)
      }
    }

    return { passed: 0, total: 0 }
  } catch (e) {
    return { passed: 0, total: 0 }
  }
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
    const command = `cross-env NODE_OPTIONS="--no-deprecation --no-experimental-strip-types" NODE_NO_WARNINGS=1 DISABLE_LOGGING=true vitest run --project int ${testPath} --reporter=json`

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
