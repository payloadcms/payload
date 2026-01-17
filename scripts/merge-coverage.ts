#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Merges coverage reports from multiple test runs into a single cumulative report.
 * This script handles coverage from:
 * - Unit tests (packages/**\/*.spec.ts)
 * - Integration tests with different DB adapters (test/**\/*int.spec.ts)
 * - E2E tests (test/**\/*e2e.spec.ts) - if coverage is collected
 */

const ROOT_DIR = process.cwd()
const COVERAGE_DIR = path.join(ROOT_DIR, 'coverage')
const MERGED_DIR = path.join(COVERAGE_DIR, 'merged')
const NYC_OUTPUT_DIR = path.join(COVERAGE_DIR, '.nyc_output')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function exec(command: string, options?: { silent?: boolean }): string {
  const stdio = options?.silent ? 'pipe' : 'inherit'
  try {
    return execSync(command, { stdio, encoding: 'utf-8', cwd: ROOT_DIR })
  } catch (error) {
    if (options?.silent) {
      return ''
    }
    throw error
  }
}

function findCoverageFiles(): string[] {
  const coverageDirs = [
    path.join(COVERAGE_DIR, 'unit'),
    path.join(COVERAGE_DIR, 'int'),
    path.join(COVERAGE_DIR, 'int-mongodb'),
    path.join(COVERAGE_DIR, 'int-postgres'),
    path.join(COVERAGE_DIR, 'int-sqlite'),
    path.join(COVERAGE_DIR, 'int-firestore'),
    path.join(COVERAGE_DIR, 'e2e'),
  ]

  const coverageFiles: string[] = []

  for (const dir of coverageDirs) {
    const coverageFile = path.join(dir, 'coverage-final.json')
    if (fs.existsSync(coverageFile)) {
      coverageFiles.push(coverageFile)
      console.log(`✓ Found coverage: ${path.relative(ROOT_DIR, coverageFile)}`)
    }
  }

  return coverageFiles
}

function mergeCoverageFiles(files: string[]): void {
  if (files.length === 0) {
    console.error('❌ No coverage files found to merge')
    console.log('\nRun tests with coverage first:')
    console.log('  pnpm test:coverage:int')
    console.log('  pnpm test:coverage:unit')
    process.exit(1)
  }

  console.log(`\n📊 Merging ${files.length} coverage file(s)...\n`)

  // Ensure output directory exists
  ensureDir(NYC_OUTPUT_DIR)

  // Copy all coverage files to .nyc_output directory with unique names
  files.forEach((file, index) => {
    const destFile = path.join(NYC_OUTPUT_DIR, `coverage-${index}.json`)
    fs.copyFileSync(file, destFile)
  })

  // Generate merged report using nyc
  console.log('📈 Generating merged coverage report...\n')
  exec('npx nyc report')

  console.log('\n✅ Coverage merge complete!')
  console.log(`\nView reports:`)
  console.log(`  Text summary: (shown above)`)
  console.log(`  HTML report: open coverage/merged/index.html`)
  console.log(`  LCOV report: coverage/merged/lcov.info`)
}

function main(): void {
  console.log('🔍 Searching for coverage files...\n')

  const coverageFiles = findCoverageFiles()
  mergeCoverageFiles(coverageFiles)
}

main()
