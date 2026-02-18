#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import libCoverage from 'istanbul-lib-coverage'
import path from 'path'
import { fileURLToPath } from 'url'

const { createCoverageMap } = libCoverage

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Processes Playwright V8 coverage data and converts it to Istanbul format
 * that can be merged with Vitest coverage.
 */

const ROOT_DIR = process.cwd()
const E2E_COVERAGE_DIR = path.join(ROOT_DIR, 'coverage/e2e')
const TEMP_DIR = path.join(E2E_COVERAGE_DIR, 'temp')

const processE2ECoverage = () => {
  console.log('🔄 Processing E2E coverage data...\n')

  if (!fs.existsSync(E2E_COVERAGE_DIR)) {
    console.log('⚠️  No E2E coverage data found. Skipping.')
    return
  }

  // Find all V8 coverage files
  const coverageFiles = fs
    .readdirSync(E2E_COVERAGE_DIR)
    .filter((file) => file.startsWith('coverage-') && file.endsWith('.json'))

  if (coverageFiles.length === 0) {
    console.log('⚠️  No coverage files found in coverage/e2e/')
    return
  }

  console.log(`Found ${coverageFiles.length} coverage file(s)`)

  // Create temp directory for processed coverage
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  let totalFiles = 0
  const coverageMap = createCoverageMap()

  // Process each coverage file
  for (const file of coverageFiles) {
    const filePath = path.join(E2E_COVERAGE_DIR, file)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      // Process V8 coverage entries
      if (data.result && Array.isArray(data.result)) {
        for (const entry of data.result) {
          // Skip non-source files
          if (
            !entry.url ||
            entry.url.includes('node_modules') ||
            !entry.url.includes('packages/')
          ) {
            continue
          }

          // Convert URL to file path
          let filePath = entry.url
          if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            // Extract path from URL
            const url = new URL(filePath)
            filePath = url.pathname
          }

          // Try to resolve to actual file path
          let resolvedPath = filePath
          if (filePath.startsWith('/')) {
            resolvedPath = path.join(ROOT_DIR, filePath)
          }

          if (!fs.existsSync(resolvedPath)) {
            continue
          }

          totalFiles++

          // Convert V8 coverage to Istanbul format
          const fileContent = fs.readFileSync(resolvedPath, 'utf-8')
          const lines = fileContent.split('\n')

          // Build statement map from ranges
          const statementMap: Record<string, any> = {}
          const fnMap: Record<string, any> = {}
          const branchMap: Record<string, any> = {}
          const s: Record<string, number> = {}
          const f: Record<string, number> = {}
          const b: Record<string, number[]> = {}

          // Simple conversion: each range is a statement
          if (entry.functions && entry.functions[0]) {
            const ranges = entry.functions[0].ranges || []
            ranges.forEach((range: any, idx: number) => {
              statementMap[idx] = {
                start: { line: 1, column: range.startOffset },
                end: { line: lines.length, column: range.endOffset },
              }
              s[idx] = range.count || 0
            })
          }

          const coverage = {
            path: resolvedPath,
            statementMap,
            fnMap,
            branchMap,
            s,
            f,
            b,
          }

          coverageMap.addFileCoverage(coverage)
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process ${file}:`, error)
    }
  }

  // Write merged coverage in Istanbul format
  const mergedCoveragePath = path.join(E2E_COVERAGE_DIR, 'coverage-final.json')
  fs.writeFileSync(mergedCoveragePath, JSON.stringify(coverageMap.toJSON(), null, 2))

  console.log(`\n✅ Processed ${totalFiles} file(s) from E2E coverage`)
  console.log(`   Output: ${path.relative(ROOT_DIR, mergedCoveragePath)}\n`)

  // Clean up temp files
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

processE2ECoverage().catch((error: any) => {
  console.error('❌ Failed to process E2E coverage:', error)
  process.exit(1)
})
