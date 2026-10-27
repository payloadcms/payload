#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { convertDemo } from './convert-demo.mjs'
import {
  parseViewport,
  previewDemo,
  recordDemo,
  sanitizeLabel,
  validateDemo,
} from './record-demo.mjs'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DEFAULT_INTERACTION_PAUSE_MS = 300
const DEFAULT_LABEL = 'feature-demo'
const DEFAULT_MOUSE_MOVE_MS = 300
const DEFAULT_VIEWPORT = { height: 900, width: 1440 }
const MODES = new Set(['candidate', 'preflight', 'preview', 'validate', 'verify'])

export function parseArgs(argv) {
  const args = [...argv]
  const requestedMode = args[0] && !args[0].startsWith('--') ? args.shift() : 'candidate'

  if (!MODES.has(requestedMode)) {
    throw new Error(`Unknown mode: ${requestedMode}`)
  }

  const values = new Map()
  const supportedOptions = new Set([
    '--a11y',
    '--base-url',
    '--contact-sheet',
    '--interaction-pause-ms',
    '--label',
    '--manifest',
    '--mouse-move-ms',
    '--output',
    '--raw-output',
    '--scenario',
    '--viewport',
  ])

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index]
    const value = args[index + 1]

    if (!supportedOptions.has(option)) {
      throw new Error(`Unknown option: ${option}`)
    }
    if (!value || value.startsWith('--')) {
      throw new Error(`${option} requires a value`)
    }

    values.set(option, value)
  }

  const scenario = values.get('--scenario')
  if (!['preflight', 'verify'].includes(requestedMode) && !scenario) {
    throw new Error(`--scenario is required for ${requestedMode} mode`)
  }

  const a11y = values.get('--a11y')
  if (a11y !== undefined && !['on', 'off'].includes(a11y)) {
    throw new Error('--a11y must be on or off')
  }

  const label = sanitizeLabel(values.get('--label') ?? DEFAULT_LABEL)
  const output = values.get('--output') ?? `/tmp/payload-pr-demo-${label}.mp4`
  const outputBase = output.replace(/\.[^.]+$/, '')

  return {
    ...(a11y === undefined ? {} : { a11y }),
    baseURL: values.get('--base-url') ?? DEFAULT_BASE_URL,
    contactSheet: values.get('--contact-sheet') ?? `${outputBase}-contact-sheet.png`,
    interactionPauseMs: parseTiming({
      name: '--interaction-pause-ms',
      value: values.get('--interaction-pause-ms') ?? DEFAULT_INTERACTION_PAUSE_MS,
    }),
    label,
    manifest: values.get('--manifest') ?? `${outputBase}.json`,
    mode: requestedMode,
    mouseMoveMs: parseTiming({
      name: '--mouse-move-ms',
      value: values.get('--mouse-move-ms') ?? DEFAULT_MOUSE_MOVE_MS,
    }),
    output,
    rawOutput: values.get('--raw-output') ?? `${outputBase}.webm`,
    scenario,
    viewport: parseViewport(values.get('--viewport') ?? '1440x900'),
  }
}

export async function packageCandidate({
  contactSheet,
  environment = process.env,
  label,
  manifest,
  output,
  rawOutput,
  recordingOptions,
  scenario,
  scenarioSource,
  trimStart,
}) {
  if (!Number.isFinite(trimStart) || trimStart < 0) {
    throw new Error('Candidate is missing a valid opening ready time')
  }

  await assertCandidatePathsAvailable({ contactSheet, manifest, output, rawOutput })

  const resolvedContactSheet = path.resolve(contactSheet)
  const resolvedManifest = path.resolve(manifest)
  const resolvedOutput = path.resolve(output)
  const resolvedRawOutput = path.resolve(rawOutput)
  const resolvedScenario = path.resolve(scenario)
  if (scenarioSource && !(await readFile(resolvedScenario)).equals(scenarioSource)) {
    throw new Error(
      'The scenario changed during this take. Use a new --label and record again so the script matches the video.',
    )
  }

  await convertDemo({
    environment,
    input: resolvedRawOutput,
    output: resolvedOutput,
    trimStart,
  })

  runCommand({
    args: ['-v', 'error', '-i', resolvedOutput, '-f', 'null', '-'],
    command: 'ffmpeg',
    environment,
  })

  const probe = runCommand({
    args: [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height:format=duration',
      '-of',
      'json',
      resolvedOutput,
    ],
    command: 'ffprobe',
    environment,
  })
  const probeData = JSON.parse(probe.stdout)
  const videoStream = probeData.streams?.[0]
  const durationSeconds = Number(probeData.format?.duration)

  if (
    videoStream?.codec_name !== 'h264' ||
    !Number.isFinite(durationSeconds) ||
    !Number.isFinite(videoStream.width) ||
    !Number.isFinite(videoStream.height)
  ) {
    throw new Error('Candidate metadata is incomplete or not GitHub-compatible H.264 video')
  }

  await mkdir(path.dirname(resolvedContactSheet), { recursive: true })
  const previewFramesPerSecond = Math.min(3, 6 / Math.max(durationSeconds, 1))
  runCommand({
    args: [
      '-y',
      '-v',
      'error',
      '-i',
      resolvedOutput,
      '-vf',
      `fps=${previewFramesPerSecond},scale=480:-2,tile=3x2:padding=8:margin=8`,
      '-frames:v',
      '1',
      resolvedContactSheet,
    ],
    command: 'ffmpeg',
    environment,
  })

  const fileStats = await stat(resolvedOutput)
  const fileBuffer = await readFile(resolvedOutput)
  const sha256 = createHash('sha256').update(fileBuffer).digest('hex')
  const metadata = {
    codec: videoStream.codec_name,
    durationSeconds,
    height: videoStream.height,
    width: videoStream.width,
  }
  const script = await saveScenarioSnapshot({
    output: resolvedOutput,
    scenario: resolvedScenario,
    source: scenarioSource,
  })
  const candidateManifest = {
    contactSheet: resolvedContactSheet,
    createdAt: new Date().toISOString(),
    label,
    metadata,
    mp4: resolvedOutput,
    ...(recordingOptions ? { recordingOptions } : {}),
    scenario: resolvedScenario,
    scenarioSnapshot: script.path,
    scenarioSha256: script.sha256,
    sha256,
    sizeBytes: fileStats.size,
  }

  await mkdir(path.dirname(resolvedManifest), { recursive: true })
  await writeFile(resolvedManifest, `${JSON.stringify(candidateManifest, null, 2)}\n`)
  await rm(resolvedRawOutput, { force: true })

  return {
    contactSheetPath: resolvedContactSheet,
    manifestPath: resolvedManifest,
    metadata,
    outputPath: resolvedOutput,
    scenarioSnapshotPath: script.path,
    sha256,
    sizeBytes: fileStats.size,
  }
}

export async function saveScenarioSnapshot({ output, scenario, source }) {
  const scriptPath = scenarioSnapshotPath({ output })
  const scriptSource = source ?? (await readFile(scenario))
  const sha256 = createHash('sha256').update(scriptSource).digest('hex')
  await mkdir(path.dirname(scriptPath), { recursive: true })
  await writeFile(scriptPath, scriptSource, { flag: 'wx' })
  return { path: scriptPath, sha256 }
}

export async function verifyCandidateManifest(manifestPath) {
  const resolvedManifest = path.resolve(manifestPath)
  const candidateManifest = JSON.parse(await readFile(resolvedManifest, 'utf8'))

  if (
    typeof candidateManifest.mp4 !== 'string' ||
    typeof candidateManifest.sha256 !== 'string' ||
    !Number.isFinite(candidateManifest.sizeBytes) ||
    typeof candidateManifest.scenarioSnapshot !== 'string' ||
    typeof candidateManifest.scenarioSha256 !== 'string'
  ) {
    throw new Error(`Candidate manifest is incomplete: ${resolvedManifest}`)
  }

  const fileBuffer = await readFile(candidateManifest.mp4)
  const fileStats = await stat(candidateManifest.mp4)
  const sha256 = createHash('sha256').update(fileBuffer).digest('hex')

  if (sha256 !== candidateManifest.sha256 || fileStats.size !== candidateManifest.sizeBytes) {
    throw new Error(
      `The current MP4 does not match the reviewed candidate in ${resolvedManifest}. Review it again before upload.`,
    )
  }

  const scriptBuffer = await readFile(candidateManifest.scenarioSnapshot)
  const scenarioSha256 = createHash('sha256').update(scriptBuffer).digest('hex')

  if (scenarioSha256 !== candidateManifest.scenarioSha256) {
    throw new Error(
      `The scenario snapshot does not match the reviewed candidate in ${resolvedManifest}. Review it again before upload.`,
    )
  }

  return { manifest: resolvedManifest, mp4: candidateManifest.mp4, sha256 }
}

export async function assertCandidatePathsAvailable({ contactSheet, manifest, output, rawOutput }) {
  const protectedPaths = [contactSheet, manifest, output, scenarioSnapshotPath({ output })].map(
    (candidatePath) => path.resolve(candidatePath),
  )
  const allPaths = rawOutput ? [...protectedPaths, path.resolve(rawOutput)] : protectedPaths

  if (new Set(allPaths).size !== allPaths.length) {
    throw new Error(
      'Candidate artifact paths must be distinct, including the scenario snapshot and raw recording',
    )
  }

  const existingPaths = []

  for (const candidatePath of protectedPaths) {
    try {
      await stat(candidatePath)
      existingPaths.push(candidatePath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  if (existingPaths.length > 0) {
    throw new Error(
      `Candidate review evidence already exists at ${existingPaths.join(', ')}. Use a new --label for the next take.`,
    )
  }
}

export async function runPreparation(options) {
  const startedAt = performance.now()

  if (options.mode === 'verify') {
    const result = await verifyCandidateManifest(options.manifest)
    printStage('Reviewed candidate bytes verified', startedAt)
    console.log(`Candidate: ${result.mp4}`)
    console.log(`SHA256: ${result.sha256}`)
    return result
  }

  await runPreflight({
    baseURL: options.baseURL,
    requiresServer: options.mode !== 'preflight',
  })
  printStage('Environment ready', startedAt)

  if (options.mode === 'preflight') {
    return
  }

  if (options.mode === 'validate') {
    await runWithScenarioFixture(options, async (fixture) => {
      await validateDemo({
        a11y: options.a11y,
        baseURL: options.baseURL,
        fixture,
        label: options.label,
        scenario: options.scenario,
        viewport: options.viewport,
      })
    })
    printStage('Scenario validated', startedAt)
    return
  }

  if (options.mode === 'preview') {
    const previewOutput = options.output.replace(/\.[^.]+$/, '-preview.png')

    await runWithScenarioFixture(options, async (fixture) => {
      await previewDemo({
        a11y: options.a11y,
        baseURL: options.baseURL,
        fixture,
        label: options.label,
        output: previewOutput,
        scenario: options.scenario,
        viewport: options.viewport,
      })
    })
    printStage(`Preview ready: ${path.resolve(previewOutput)}`, startedAt)
    return path.resolve(previewOutput)
  }

  await assertCandidatePathsAvailable(options)
  const scenarioSource = await readFile(options.scenario)

  await runWithScenarioFixture(options, async (fixture) => {
    await validateDemo({
      a11y: options.a11y,
      baseURL: options.baseURL,
      fixture,
      label: options.label,
      scenario: options.scenario,
      viewport: options.viewport,
    })
  })
  printStage('Scenario validated', startedAt)

  let trimStart
  await runWithScenarioFixture(options, async (fixture) => {
    await recordDemo({
      a11y: options.a11y,
      baseURL: options.baseURL,
      fixture,
      interactionPauseMs: options.interactionPauseMs,
      label: options.label,
      mouseMoveMs: options.mouseMoveMs,
      onOpeningReady: (seconds) => {
        trimStart = seconds
      },
      output: options.rawOutput,
      scenario: options.scenario,
      viewport: options.viewport,
    })
  })
  printStage('Recording complete', startedAt)

  const result = await packageCandidate({
    contactSheet: options.contactSheet,
    label: options.label,
    manifest: options.manifest,
    output: options.output,
    rawOutput: options.rawOutput,
    scenario: options.scenario,
    scenarioSource,
    recordingOptions: {
      a11y: options.a11y ?? 'scenario',
      mouseMoveMs: options.mouseMoveMs,
      interactionPauseMs: options.interactionPauseMs,
      viewport: options.viewport,
    },
    trimStart,
  })
  printStage('Candidate verified', startedAt)
  printCandidate(result)

  return result
}

async function runPreflight({ baseURL, requiresServer }) {
  const { chromium } = await import('@playwright/test')
  await access(chromium.executablePath())

  for (const command of ['ffmpeg', 'ffprobe']) {
    runCommand({ args: ['-version'], command })
  }

  if (!requiresServer) {
    return
  }

  let response
  try {
    response = await fetch(baseURL, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    })
  } catch (error) {
    throw new Error(`Payload server is not reachable at ${baseURL}: ${error.message}`)
  }

  if (response.status >= 500) {
    throw new Error(`Payload server returned ${response.status} at ${baseURL}`)
  }
}

export async function runWithScenarioFixture(options, action) {
  const scenarioURL = pathToFileURL(path.resolve(options.scenario)).href
  const scenarioModule = await import(scenarioURL)
  const { request } = await import('@playwright/test')
  const requestContext = await request.newContext({ baseURL: options.baseURL })
  const hasSetup = typeof scenarioModule.setup === 'function'
  let isSetupComplete = !hasSetup
  let fixture
  const errors = []

  try {
    if (hasSetup) {
      fixture = await scenarioModule.setup({
        baseURL: options.baseURL,
        label: options.label,
        request: requestContext,
      })
      isSetupComplete = true
    }

    await action(fixture)
  } catch (error) {
    errors.push(error)
  }

  try {
    if (isSetupComplete && typeof scenarioModule.teardown === 'function') {
      await scenarioModule.teardown({
        baseURL: options.baseURL,
        fixture,
        label: options.label,
        request: requestContext,
      })
    }
  } catch (error) {
    errors.push(error)
  }

  try {
    await requestContext.dispose()
  } catch (error) {
    errors.push(error)
  }

  if (errors.length === 1) throw errors[0]
  if (errors.length > 1) {
    throw new AggregateError(
      errors,
      `Scenario execution and cleanup failed: ${errors.map((error) => (error instanceof Error ? error.message : String(error))).join('; ')}`,
      { cause: errors[0] },
    )
  }
}

function scenarioSnapshotPath({ output }) {
  return path.resolve(`${output.replace(/\.[^.]+$/, '')}.scenario.mjs`)
}

function parseTiming({ name, value }) {
  const milliseconds = Number(value)

  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error(`${name} must be a non-negative number`)
  }

  return milliseconds
}

function runCommand({ args, command, environment = process.env }) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: environment,
    maxBuffer: 10 * 1024 * 1024,
  })

  if (result.error) {
    throw new Error(`${command} failed to start: ${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout).trim()}`)
  }

  return result
}

function printStage(message, startedAt) {
  const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1)
  console.log(`✓ ${message} (${elapsedSeconds}s)`)
}

function printCandidate(result) {
  console.log(`\nCandidate: ${result.outputPath}`)
  console.log(`Duration: ${result.metadata.durationSeconds.toFixed(2)}s`)
  console.log(`Size: ${(result.sizeBytes / 1024).toFixed(0)} KiB`)
  console.log(`SHA256: ${result.sha256}`)
  console.log(`Review script: ${result.scenarioSnapshotPath}`)
  console.log(`Review sheet: ${result.contactSheetPath}`)
  console.log(`Manifest: ${result.manifestPath}`)
  console.log('Awaiting approval — nothing uploaded.')
}

function printHelp() {
  console.log(`Usage: prepare-demo.mjs [candidate|validate|preview|preflight|verify] [options]

Modes:
  candidate            Record, convert, verify, inventory, and prepare review assets (default)
  validate             Run the scenario quickly without recording video
  preview              Capture a fast final-state PNG without recording video
  preflight            Check local recording tools; does not require a scenario or server
  verify               Confirm an MP4 still matches its reviewed candidate manifest

Options:
  --a11y on|off        Override a11y feedback; omit to use the scenario setting
  --scenario PATH      Scenario module; required for candidate, validate, and preview
  --label TEXT         Safe output label (default: ${DEFAULT_LABEL})
  --base-url URL       Running Payload URL (default: ${DEFAULT_BASE_URL})
  --output PATH        Candidate MP4 output
  --raw-output PATH    Intermediate WebM output
  --contact-sheet PATH Contact sheet PNG output
  --manifest PATH      Candidate JSON manifest output
  --viewport WxH       Viewport (default: ${DEFAULT_VIEWPORT.width}x${DEFAULT_VIEWPORT.height})
  --mouse-move-ms MS   Cursor travel time (default: ${DEFAULT_MOUSE_MOVE_MS})
  --interaction-pause-ms MS
                       Dwell before and after clicks (default: ${DEFAULT_INTERACTION_PAUSE_MS})
  --help               Show this help`)
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  if (process.argv.includes('--help')) {
    printHelp()
  } else {
    try {
      await runPreparation(parseArgs(process.argv.slice(2)))
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  }
}
