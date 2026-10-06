import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { pathToFileURL } from 'node:url'

import * as preparation from './prepare-demo.mjs'

const { packageCandidate, parseArgs, verifyCandidateManifest } = preparation

const testDirectories = []

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

test('parseArgs makes candidate creation the one-command default', () => {
  const options = parseArgs(['--scenario', '/tmp/demo.mjs', '--label', 'Hierarchy Move'])

  assert.deepEqual(options, {
    baseURL: 'http://localhost:3000',
    contactSheet: '/tmp/payload-pr-demo-hierarchy-move-contact-sheet.png',
    interactionPauseMs: 300,
    label: 'hierarchy-move',
    manifest: '/tmp/payload-pr-demo-hierarchy-move.json',
    mode: 'candidate',
    mouseMoveMs: 400,
    output: '/tmp/payload-pr-demo-hierarchy-move.mp4',
    rawOutput: '/tmp/payload-pr-demo-hierarchy-move.webm',
    scenario: '/tmp/demo.mjs',
    viewport: { height: 900, width: 1440 },
  })
})

test('parseArgs supports fast validation and preview modes', () => {
  const validation = parseArgs(['validate', '--scenario', './demo.mjs'])
  const preview = parseArgs(['preview', '--scenario', './demo.mjs'])

  assert.equal(validation.mode, 'validate')
  assert.equal(preview.mode, 'preview')
})

test('parseArgs lets preflight run before a scenario exists', () => {
  const options = parseArgs(['preflight', '--base-url', 'http://localhost:4000'])

  assert.equal(options.mode, 'preflight')
  assert.equal(options.scenario, undefined)
})

test('parseArgs lets an approved candidate be verified from its manifest', () => {
  const options = parseArgs(['verify', '--manifest', '/tmp/reviewed-demo.json'])

  assert.equal(options.mode, 'verify')
  assert.equal(options.manifest, '/tmp/reviewed-demo.json')
  assert.equal(options.scenario, undefined)
})

test('parseArgs requires a scenario for modes that execute one', () => {
  assert.throws(() => parseArgs(['candidate']), /--scenario is required for candidate mode/)
})

test('assertCandidatePathsAvailable prevents a revised take from replacing review evidence', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-existing-take-test-'))
  testDirectories.push(directory)
  const output = path.join(directory, 'demo.mp4')
  await writeFile(output, 'reviewed candidate')

  await assert.rejects(
    preparation.assertCandidatePathsAvailable({
      contactSheet: path.join(directory, 'demo-contact-sheet.png'),
      manifest: path.join(directory, 'demo.json'),
      output,
      rawOutput: path.join(directory, 'demo.webm'),
    }),
    /Use a new --label for the next take/,
  )
})

test('packageCandidate converts, verifies, inventories, and cleans up a candidate', async () => {
  const directory = await createFakeMediaTools()
  const rawOutput = path.join(directory, 'demo.webm')
  const output = path.join(directory, 'demo.mp4')
  const contactSheet = path.join(directory, 'demo-contact-sheet.png')
  const manifest = path.join(directory, 'demo.json')
  const scenario = path.join(directory, 'scenario.mjs')

  await writeFile(rawOutput, 'recording')
  await writeFile(scenario, 'export default async function scenario() {}')

  const result = await packageCandidate({
    contactSheet,
    environment: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    label: 'demo',
    manifest,
    output,
    rawOutput,
    scenario,
  })

  assert.equal(result.manifestPath, manifest)
  assert.equal(result.metadata.codec, 'h264')
  assert.equal(result.metadata.durationSeconds, 12.5)
  assert.equal(result.metadata.height, 900)
  assert.equal(result.metadata.width, 1440)
  assert.equal(result.sha256, '3ebb153fb24e4411400e94a9a92b0ec458c3a8473e51e03cd37d4a34c99dfda6')
  assert.equal((await stat(output)).size, 9)
  assert.equal(await readFile(contactSheet, 'utf8'), 'contact-sheet')
  await assert.rejects(stat(rawOutput), { code: 'ENOENT' })

  const savedManifest = JSON.parse(await readFile(manifest, 'utf8'))
  assert.equal(savedManifest.mp4, output)
  assert.equal(savedManifest.contactSheet, contactSheet)
  assert.equal(savedManifest.scenario, scenario)
  assert.equal(savedManifest.sha256, result.sha256)
  assert.equal(savedManifest.sizeBytes, 9)
})

test('runWithScenarioFixture wraps execution in scenario setup and teardown hooks', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-fixture-test-'))
  testDirectories.push(directory)
  const scenario = path.join(directory, 'scenario.mjs')

  await writeFile(
    scenario,
    `export const events = []
export async function setup({ label }) {
  events.push('setup:' + label)
  return { title: 'Prepared document' }
}
export async function teardown({ fixture }) {
  events.push('teardown:' + fixture.title)
}
export default async function scenario() {}`,
  )

  assert.equal(typeof preparation.runWithScenarioFixture, 'function')

  let receivedFixture
  await preparation.runWithScenarioFixture(
    {
      baseURL: 'http://localhost:3000',
      label: 'fixture-demo',
      scenario,
    },
    async (fixture) => {
      receivedFixture = fixture
    },
  )

  assert.deepEqual(receivedFixture, { title: 'Prepared document' })
  const scenarioModule = await import(pathToFileURL(scenario).href)
  assert.deepEqual(scenarioModule.events, ['setup:fixture-demo', 'teardown:Prepared document'])
})

test('runWithScenarioFixture preserves setup failures without running teardown on an absent fixture', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-setup-failure-test-'))
  testDirectories.push(directory)
  const scenario = path.join(directory, 'scenario.mjs')

  await writeFile(
    scenario,
    `export async function setup() {
  throw new Error('fixture setup failed')
}
export async function teardown() {
  throw new Error('teardown masked setup failure')
}
export default async function scenario() {}`,
  )

  await assert.rejects(
    preparation.runWithScenarioFixture(
      { baseURL: 'http://localhost:3000', label: 'failure-demo', scenario },
      async () => {},
    ),
    /fixture setup failed/,
  )
})

test('verifyCandidateManifest accepts unchanged reviewed bytes and rejects replacements', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-verification-test-'))
  testDirectories.push(directory)
  const output = path.join(directory, 'demo.mp4')
  const manifest = path.join(directory, 'demo.json')

  await writeFile(output, 'recording')
  await writeFile(
    manifest,
    JSON.stringify({
      mp4: output,
      sha256: '3ebb153fb24e4411400e94a9a92b0ec458c3a8473e51e03cd37d4a34c99dfda6',
      sizeBytes: 9,
    }),
  )

  const result = await verifyCandidateManifest(manifest)
  assert.equal(result.mp4, output)
  assert.equal(result.sha256, '3ebb153fb24e4411400e94a9a92b0ec458c3a8473e51e03cd37d4a34c99dfda6')

  await writeFile(output, 'replacement')
  await assert.rejects(verifyCandidateManifest(manifest), /does not match the reviewed candidate/)
})

async function createFakeMediaTools() {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-test-'))
  testDirectories.push(directory)

  await writeFile(
    path.join(directory, 'ffmpeg'),
    `#!/usr/bin/env bash
set -euo pipefail
args=" $* "
if [[ "$args" == *" -f null - "* ]]; then
  exit 0
fi
output="\${!#}"
if [[ "$output" == *.png ]]; then
  printf contact-sheet > "$output"
  exit 0
fi
input=""
previous=""
for argument in "$@"; do
  if [ "$previous" = "-i" ]; then input="$argument"; fi
  previous="$argument"
done
cp "$input" "$output"
`,
  )
  await writeFile(
    path.join(directory, 'ffprobe'),
    `#!/usr/bin/env bash
if [[ " $* " == *" json "* ]]; then
  printf '{"format":{"duration":"12.500000"},"streams":[{"codec_name":"h264","height":900,"width":1440}]}'
else
  printf 'h264\\n'
fi
`,
  )
  await chmod(path.join(directory, 'ffmpeg'), 0o755)
  await chmod(path.join(directory, 'ffprobe'), 0o755)

  return directory
}
