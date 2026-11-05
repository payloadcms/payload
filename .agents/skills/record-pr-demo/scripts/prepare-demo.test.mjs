import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, test } from 'node:test'

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
    mouseMoveMs: 300,
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
    recordingOptions: { a11y: 'off', mouseMoveMs: 300 },
    trimStart: 1.25,
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
  assert.deepEqual(savedManifest.recordingOptions, { a11y: 'off', mouseMoveMs: 300 })
  assert.equal(savedManifest.mp4, output)
  assert.equal(savedManifest.contactSheet, contactSheet)
  assert.equal(savedManifest.scenario, scenario)
  assert.equal(savedManifest.sha256, result.sha256)
  assert.equal(savedManifest.sizeBytes, 9)
  const scriptPath = path.join(directory, 'demo.scenario.mjs')
  const originalSource = await readFile(scenario, 'utf8')
  assert.equal(result.scenarioSnapshotPath, scriptPath)
  assert.equal(savedManifest.scenarioSnapshot, scriptPath)
  assert.equal(await readFile(scriptPath, 'utf8'), originalSource)
  await writeFile(scenario, 'export default async function revisedScenario() {}')
  assert.equal(await readFile(scriptPath, 'utf8'), originalSource)
  assert.equal(
    savedManifest.scenarioSha256,
    createHash('sha256').update(originalSource).digest('hex'),
  )
  assert.match(await readFile(path.join(directory, 'convert-args.txt'), 'utf8'), /-ss 1\.25/)
})

test('packageCandidate rejects video that exceeds the upload budget', async () => {
  const directory = await createFakeMediaTools({
    outputBytes: 10 * 1024 * 1024 + 1,
  })
  const rawOutput = path.join(directory, 'demo.webm')
  await writeFile(rawOutput, 'recording')

  await assert.rejects(
    packageCandidate({
      contactSheet: path.join(directory, 'demo-contact-sheet.png'),
      environment: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      label: 'demo',
      manifest: path.join(directory, 'demo.json'),
      output: path.join(directory, 'demo.mp4'),
      rawOutput,
      scenario: path.join(directory, 'scenario.mjs'),
      trimStart: 0,
    }),
    /exceeds the 10240 KB upload budget/,
  )
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

  const scenarioSnapshot = path.join(directory, 'demo.scenario.mjs')
  await writeFile(scenarioSnapshot, 'reviewed script')
  await writeFile(output, 'recording')
  await writeFile(
    manifest,
    JSON.stringify({
      mp4: output,
      scenarioSnapshot,
      scenarioSha256: createHash('sha256').update('reviewed script').digest('hex'),
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

async function createFakeMediaTools({ outputBytes } = {}) {
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
printf '%s ' "$@" > "${directory}/convert-args.txt"
input=""
previous=""
for argument in "$@"; do
  if [ "$previous" = "-i" ]; then input="$argument"; fi
  previous="$argument"
done
cp "$input" "$output"
${outputBytes ? `truncate -s ${outputBytes} "$output"` : ''}
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

test('should clean up a prepared fixture when the walkthrough fails', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-failed-walkthrough-'))
  testDirectories.push(directory)
  const scenario = path.join(directory, 'scenario.mjs')
  await writeFile(
    scenario,
    `export const events = []
export async function setup({ request }) {
  if (typeof request.post !== 'function') throw new Error('API context missing')
  events.push('setup')
  return { id: 'recording-only' }
}
export async function teardown({ fixture, request }) {
  if (typeof request.delete !== 'function') throw new Error('API context missing')
  events.push('cleanup:' + fixture.id)
}`,
  )
  await assert.rejects(
    preparation.runWithScenarioFixture({ scenario, baseURL: 'http://localhost:3000' }, async () => {
      throw new Error('Walkthrough failed')
    }),
    /Walkthrough failed/,
  )
  const module = await import(pathToFileURL(scenario).href)
  assert.deepEqual(module.events, ['setup', 'cleanup:recording-only'])
})

test('should protect an existing script snapshot from being overwritten by another take', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-existing-script-'))
  testDirectories.push(directory)
  const output = path.join(directory, 'demo.mp4')
  await writeFile(path.join(directory, 'demo.scenario.mjs'), 'reviewed script')
  await assert.rejects(
    preparation.assertCandidatePathsAvailable({
      output,
      contactSheet: path.join(directory, 'demo.png'),
      manifest: path.join(directory, 'demo.json'),
    }),
    /Use a new --label/,
  )
})

test('should reject packaging when the scenario changes during a take', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-script-changed-'))
  testDirectories.push(directory)
  const scenario = path.join(directory, 'scenario.mjs')
  const scenarioSource = Buffer.from('export default async function original() {}')
  await writeFile(scenario, 'export default async function revised() {}')
  await assert.rejects(
    packageCandidate({
      scenario,
      scenarioSource,
      trimStart: 0,
      output: path.join(directory, 'demo.mp4'),
      rawOutput: path.join(directory, 'demo.webm'),
      manifest: path.join(directory, 'demo.json'),
      contactSheet: path.join(directory, 'demo.png'),
    }),
    /scenario changed during this take/,
  )
})

test('should reject colliding candidate paths before any artifacts exist', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-collision-'))
  testDirectories.push(directory)
  const output = path.join(directory, 'demo.mp4')
  for (const overrides of [
    { manifest: path.join(directory, 'demo.scenario.mjs') },
    { contactSheet: output },
    { rawOutput: output },
  ]) {
    await assert.rejects(
      preparation.assertCandidatePathsAvailable({
        contactSheet: path.join(directory, 'sheet.png'),
        manifest: path.join(directory, 'demo.json'),
        rawOutput: path.join(directory, 'demo.webm'),
        output,
        ...overrides,
      }),
      /distinct|collision/i,
    )
  }
})

test('should reject a modified or missing scenario snapshot during verification', async () => {
  const directory = await createFakeMediaTools()
  const output = path.join(directory, 'demo.mp4')
  const rawOutput = path.join(directory, 'demo.webm')
  const manifest = path.join(directory, 'demo.json')
  const scenario = path.join(directory, 'source.mjs')
  await writeFile(rawOutput, 'recording')
  await writeFile(scenario, 'export default async function scenario() {}')
  const result = await packageCandidate({
    contactSheet: path.join(directory, 'sheet.png'),
    environment: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    label: 'demo',
    manifest,
    output,
    rawOutput,
    scenario,
    trimStart: 0,
  })
  await verifyCandidateManifest(manifest)
  await writeFile(result.scenarioSnapshotPath, 'changed after review')
  await assert.rejects(verifyCandidateManifest(manifest), /scenario snapshot.*does not match/i)
  await rm(result.scenarioSnapshotPath)
  await assert.rejects(verifyCandidateManifest(manifest))
})

test('should preserve walkthrough errors alongside teardown errors', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'prepare-pr-demo-cleanup-'))
  testDirectories.push(directory)
  const scenario = path.join(directory, 'scenario.mjs')
  await writeFile(
    scenario,
    `export async function teardown() { throw new Error('cleanup failed') }`,
  )
  const original = new Error('walkthrough failed')
  await assert.rejects(
    preparation.runWithScenarioFixture(
      {
        baseURL: 'http://localhost:3000',
        scenario,
      },
      async () => {
        throw original
      },
    ),
    (error) => {
      assert.equal(error.cause, original)
      assert.deepEqual(
        error.errors.map((error) => error.message),
        ['walkthrough failed', 'cleanup failed'],
      )
      assert.match(error.message, /walkthrough failed/)
      return true
    },
  )
  await assert.rejects(
    preparation.runWithScenarioFixture(
      {
        baseURL: 'http://localhost:3000',
        scenario,
      },
      async () => {},
    ),
    /cleanup failed/,
  )
})

test('should accept a11y overrides and reject invalid modes', () => {
  for (const a11y of ['on', 'off']) {
    assert.equal(parseArgs(['--scenario', './demo.mjs', '--a11y', a11y]).a11y, a11y)
  }
  assert.throws(
    () => parseArgs(['--scenario', './demo.mjs', '--a11y', 'maybe']),
    /--a11y must be on or off/,
  )
})
