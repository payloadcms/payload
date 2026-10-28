import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { pathToFileURL } from 'node:url'

export function buildSummary({ report, matchedFiles = [], sha = '', repositoryURL = '' }) {
  const { tests } = report
  const counts = { passed: 0, retried: 0, failed: 0, incomplete: 0 }
  const scans = tests.flatMap((test) => test.attempts.at(-1)?.scans ?? [])
  for (const test of tests) counts[outcome({ test })]++
  const lines = [
    `## Accessibility workflow results — ${escape({ value: report.framework })}`,
    '',
    `Commit ${escape({ value: sha.slice(0, 12) || 'local' })} · Chromium`,
    '',
    '<details><summary>Files matching the accessibility filter</summary>',
    '',
    ...(matchedFiles.length
      ? matchedFiles.map((value) => `- ${escape({ value })}`)
      : ['Matching-file information unavailable.']),
    '',
    '</details>',
    '',
    `**${tests.length} ${tests.length === 1 ? 'test' : 'tests'}**`,
    `${counts.passed} passed first attempt · ${counts.retried} passed after retry · ${counts.failed} failed · ${counts.incomplete} incomplete`,
    `**Axe:** ${scans.length} state scans completed · ${scans.reduce((total, scan) => total + scan.violations, 0)} violations (final attempts)`,
    '',
  ]
  if (!tests.length) lines.push('⚠️ No tests were selected.', '')
  if (report.status !== 'passed') lines.push(`⚠️ Run: ${escape({ value: report.status })}.`, '')
  for (const value of report.errors) lines.push(`**Runner error:** ${escape({ value })}`, '')
  lines.push('| Workflow exercised | Result |', '|---|---|')
  for (const workflow of new Set(tests.map((test) => test.workflow))) {
    const selected = tests.filter((test) => test.workflow === workflow)
    if (workflow !== 'Scanner validation')
      lines.push(`| ${escape({ value: workflow })} | ${cell({ tests: selected })} |`)
  }
  const scanner = tests.filter((test) => test.workflow === 'Scanner validation')
  if (scanner.length)
    lines.push(
      '',
      `**Scanner validation** — ${cell({ tests: scanner })}. Included in totals; checks the focus-scanning helper against deliberate good/bad fixtures.`,
      '',
    )
  const attention = tests.filter((test) => outcome({ test }) !== 'passed')
  if (attention.length) lines.push('', '### Needs attention', '')
  for (const test of attention) {
    const status = outcome({ test })
    const last = test.attempts.at(-1)
    const attempt =
      status === 'retried' ? test.attempts.find((attempt) => attempt.status !== 'passed') : last
    lines.push(
      `**${status === 'failed' ? '❌' : '⚠️'} ${escape({ value: test.workflow })}: ${escape({ value: test.title })}**`,
      '',
      status === 'retried'
        ? `Passed on attempt ${last.retry + 1}`
        : status === 'failed'
          ? `Failed after ${test.attempts.length} attempt(s)`
          : 'Incomplete',
      '',
    )
    if (attempt?.errors.length)
      lines.push(`<pre>${escape({ value: attempt.errors.join('\n').slice(0, 2000) })}</pre>`, '')
    for (const value of last?.skippedSteps ?? [])
      lines.push(`- Skipped check: ${escape({ value })}`)
    for (const value of last?.evidenceErrors ?? [])
      lines.push(`- Missing evidence: ${escape({ value })}`)
    if (status === 'failed' || status === 'retried')
      lines.push(
        status === 'failed'
          ? 'Cause: requires investigation.'
          : 'Cause: unconfirmed; passed on retry.',
        '',
      )
    if (repositoryURL && sha) {
      const source = `${repositoryURL}/blob/${encodeURIComponent(sha)}/test/${test.file.split('/').map(encodeURIComponent).join('/')}#L${test.line}`
      lines.push(`[Test source](${source})`, '')
    }
    const attachments = [
      ...new Set(test.attempts.flatMap((attempt) => attempt.attachments.map(({ name }) => name))),
    ]
    if (attachments.length)
      lines.push(
        `Available attachments: ${attachments.map((value) => escape({ value })).join(', ')}.`,
        '',
      )
  }
  lines.push('', '<details><summary>Axe checkpoints completed (final attempts)</summary>', '')
  if (!scans.length) lines.push('No completed axe checkpoints were recorded.')
  for (const scan of scans)
    lines.push(`- ${escape({ value: scan.name })}: ${scan.violations} violation(s)`)
  lines.push('', '</details>', '')
  return lines.join('\n')
}

/** Publish only Markdown produced in this job; never download results from another attempt. */
export function publishSummary({ reportPath, env = process.env }) {
  let markdown
  try {
    if (env.A11Y_TEST_OUTCOME === 'skipped') throw new Error('Tests did not run')
    markdown = readFileSync(reportPath, 'utf8')
  } catch {
    markdown = `## Accessibility workflow results — ${escape({ value: env.PAYLOAD_FRAMEWORK || 'unknown framework' })}\n\n⚠️ No test report was produced. Check this job’s setup and test logs.\n`
  }
  if (env.A11Y_TEST_OUTCOME === 'failure')
    markdown += '\n⚠️ Test command failed. Check this job’s logs.\n'
  if (env.A11Y_EVIDENCE_URL)
    markdown += `\n[Results and failure evidence](${env.A11Y_EVIDENCE_URL})\n`
  mkdirSync(path.dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, markdown)
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, markdown)
  return markdown
}

function outcome({ test }) {
  const last = test.attempts.at(-1)
  if (test.expectedStatus !== 'passed' || !last || ['skipped', 'interrupted'].includes(last.status))
    return 'incomplete'
  if (last.status !== 'passed' || last.scans.some((scan) => scan.violations > 0)) return 'failed'
  if (last.skippedSteps.length || last.evidenceErrors?.length) return 'incomplete'
  return last.retry > 0 || test.attempts.length > 1 ? 'retried' : 'passed'
}

function cell({ tests }) {
  const outcomes = tests.map((test) => outcome({ test }))
  const passed = outcomes.filter((status) => status === 'passed' || status === 'retried').length
  const retries = outcomes.filter((status) => status === 'retried').length
  const incomplete = outcomes.filter((status) => status === 'incomplete').length
  if (outcomes.includes('failed'))
    return `❌ ${passed}/${tests.length} passed${incomplete ? `; ${incomplete} incomplete` : ''}`
  if (incomplete) return `⚠️ Incomplete; ${passed}/${tests.length} passed`
  return `${retries ? '⚠️' : '✅'} ${passed}/${tests.length} passed${retries ? `; ${retries} after retry` : ''}`
}

function escape({ value }) {
  return (
    stripVTControlCharacters(String(value))
      // oxlint-disable-next-line no-control-regex -- Remove control characters from untrusted test output.
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\|/g, '&#124;')
      .replace(/\r?\n/g, '<br>')
      .replace(/([\\`*_[\]~])/g, '\\$1')
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Usage: node report.mjs <summary.md>')
  publishSummary({ reportPath: process.argv[2] })
}
