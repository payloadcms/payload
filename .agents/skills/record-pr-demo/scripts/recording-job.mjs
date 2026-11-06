#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from './prepare-demo.mjs'

const jobsRoot = path.join(tmpdir(), `payload-demo-jobs-${process.getuid?.() ?? 'local'}`)
const script = fileURLToPath(import.meta.url)
const activeStates = new Set(['starting', 'running', 'stopping'])

function jobPath({ id }) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid recording job ID')
  return path.join(jobsRoot, id)
}
async function readJSON({ file }) {
  return JSON.parse(await readFile(file, 'utf8'))
}
async function saveJSON({ file, value }) {
  const temporary = `${file}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(value), { mode: 0o600 })
  await rename(temporary, file)
}

/** Starts a supervised candidate; artifacts are confined to its private directory. */
export async function startRecordingJob({ args, leaseMs = 60000, maxDurationMs = 600000 }) {
  if (process.platform === 'win32')
    throw new Error('Recording jobs currently require macOS or Linux')
  if (![leaseMs, maxDurationMs].every((value) => Number.isFinite(value) && value > 0))
    throw new Error('Job durations must be positive')
  const options = parseArgs(['candidate', ...args])
  if (
    args.some((arg) => ['--output', '--raw-output', '--manifest', '--contact-sheet'].includes(arg))
  )
    throw new Error('Recording jobs manage their own artifact paths')
  const id = randomUUID()
  const directory = jobPath({ id })
  const artifacts = path.join(directory, 'artifacts')
  await mkdir(artifacts, { recursive: true, mode: 0o700 })
  const output = path.join(artifacts, `${options.label}.mp4`)
  const state = {
    id,
    status: 'starting',
    createdAt: Date.now(),
    output,
    log: path.join(directory, 'recording.log'),
  }
  const workerArgs = [...args]
  const scenarioIndex = workerArgs.indexOf('--scenario')
  workerArgs[scenarioIndex + 1] = path.resolve(options.scenario)
  await saveJSON({
    file: path.join(directory, 'config.json'),
    value: { args: workerArgs, leaseMs, maxDurationMs },
  })
  await saveJSON({
    file: path.join(directory, 'lease.json'),
    value: { expiresAt: Date.now() + leaseMs },
  })
  await saveJSON({ file: path.join(directory, 'state.json'), value: state })
  const worker = spawn(process.execPath, [script, 'worker', id], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  })
  await new Promise((resolve, reject) => {
    worker.once('spawn', resolve)
    worker.once('error', reject)
  })
  worker.unref()
  return state
}

/** Reads status without extending the lease. Renewal must come from the active caller. */
export async function recordingJobStatus({ id } = {}) {
  if (!id) {
    const names = await readdir(jobsRoot).catch((error) => {
      if (error.code === 'ENOENT') return []
      throw error
    })
    const jobs = await Promise.all(
      names.filter((name) => /^[0-9a-f-]{36}$/.test(name)).map((id) => recordingJobStatus({ id })),
    )
    return { jobs: jobs.filter((job) => activeStates.has(job.status)) }
  }
  const directory = jobPath({ id })
  const state = await readJSON({ file: path.join(directory, 'state.json') })
  const lease = await readJSON({ file: path.join(directory, 'lease.json') })
  return { ...state, leaseExpiresAt: lease.expiresAt }
}
export async function renewRecordingJob({ id }) {
  const directory = jobPath({ id })
  const state = await recordingJobStatus({ id })
  if (!activeStates.has(state.status)) throw new Error(`Cannot renew ${state.status} recording`)
  if (Date.now() >= state.leaseExpiresAt) throw new Error('Recording lease has expired')
  const { leaseMs } = await readJSON({ file: path.join(directory, 'config.json') })
  await saveJSON({
    file: path.join(directory, 'lease.json'),
    value: { expiresAt: Date.now() + leaseMs },
  })
  return recordingJobStatus({ id })
}
export async function stopRecordingJob({ id }) {
  const state = await recordingJobStatus({ id })
  if (activeStates.has(state.status))
    await writeFile(path.join(jobPath({ id }), 'stop'), '', { mode: 0o600 })
  return { ...state, stopRequested: activeStates.has(state.status) }
}

// Chromium may create a separate process group. Remember descendants before
// interrupting the recorder, then match creation times before killing survivors.
function processTree({ pid }) {
  const result = spawnSync('ps', ['-axo', 'pid=,ppid=,lstart='], { encoding: 'utf8' })
  if (result.status !== 0) return new Map()
  const processes = result.stdout
    .trim()
    .split('\n')
    .map((line) => {
      const [, id, parent, started] = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/) ?? []
      return { pid: Number(id), parent: Number(parent), started }
    })
  const owned = new Map([[pid, processes.find((item) => item.pid === pid)?.started]])
  for (let changed = true; changed;) {
    changed = false
    for (const item of processes)
      if (owned.has(item.parent) && !owned.has(item.pid)) {
        owned.set(item.pid, item.started)
        changed = true
      }
  }
  return owned
}
function killSurvivors({ owned }) {
  // Query each known PID's start time without following unrelated reparented processes.
  const result = spawnSync('ps', ['-axo', 'pid=,lstart='], { encoding: 'utf8' })
  if (result.status !== 0) return
  for (const line of result.stdout.trim().split('\n')) {
    const [, pid, started] = line.match(/^\s*(\d+)\s+(.+)$/) ?? []
    if (owned.has(Number(pid)) && owned.get(Number(pid)) === started) {
      try {
        process.kill(Number(pid), 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
  }
}

/** Owns the child process group through capture and conversion, including forced cleanup. */
export async function superviseRecordingJob({
  directory,
  command,
  args,
  maxDurationMs,
  pollMs = 1000,
  graceMs = 10000,
}) {
  const stateFile = path.join(directory, 'state.json')
  let state = await readJSON({ file: stateFile })
  const log = await open(state.log, 'a', 0o600)
  let child
  let timer
  let hardStop
  let reason
  let checking = false
  let isFinished = false
  let statusWrite = Promise.resolve()
  let ownedProcesses = new Map()
  const signal = (name) => {
    try {
      process.kill(-child.pid, name)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
  const cancel = (why) => {
    if (reason || isFinished) return
    reason = why
    state = { ...state, status: 'stopping', reason }
    statusWrite = saveJSON({ file: stateFile, value: state })
    ownedProcesses = processTree({ pid: child.pid })
    signal('SIGINT')
    hardStop = setTimeout(() => {
      signal('SIGKILL')
      killSurvivors({ owned: ownedProcesses })
    }, graceMs)
  }
  const interrupted = () => cancel('stopped')
  try {
    child = spawn(command, args, { detached: true, stdio: ['ignore', log.fd, log.fd] })
    const completed = new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => resolve({ code, signal }))
    })
    void completed.catch(() => {})
    process.once('SIGINT', interrupted)
    process.once('SIGTERM', interrupted)
    state = { ...state, status: 'running', pid: child.pid }
    await saveJSON({ file: stateFile, value: state })
    const check = async () => {
      if (checking || reason) return
      checking = true
      try {
        const lease = await readJSON({ file: path.join(directory, 'lease.json') })
        const stop = await readFile(path.join(directory, 'stop')).then(
          () => true,
          (error) => {
            if (error.code === 'ENOENT') return false
            throw error
          },
        )
        if (stop) cancel('stopped')
        else if (Date.now() - state.createdAt >= maxDurationMs) cancel('duration-limit')
        else if (Date.now() >= lease.expiresAt) cancel('lease-expired')
      } catch {
        cancel('control-error')
      } finally {
        checking = false
      }
    }
    timer = setInterval(() => void check(), pollMs)
    await check()
    const result = await completed
    isFinished = true
    clearInterval(timer)
    clearTimeout(hardStop)
    await statusWrite
    state = {
      ...state,
      status: reason ? 'cancelled' : result.code === 0 ? 'completed' : 'failed',
      reason,
      exitCode: result.code,
      finishedAt: Date.now(),
    }
  } catch (error) {
    isFinished = true
    if (child?.pid) signal('SIGKILL')
    state = { ...state, status: 'failed', error: error.message, finishedAt: Date.now() }
  } finally {
    clearInterval(timer)
    clearTimeout(hardStop)
    process.off('SIGINT', interrupted)
    process.off('SIGTERM', interrupted)
    if (ownedProcesses.size) killSurvivors({ owned: ownedProcesses })
    await log.close()
    if (state.status !== 'completed')
      await rm(path.join(directory, 'artifacts'), { recursive: true, force: true })
    await saveJSON({ file: stateFile, value: state })
  }
  return state
}

async function main({ args }) {
  const [action, ...rest] = args
  if (action === 'start') {
    let leaseMs = 60000,
      maxDurationMs = 600000
    const candidate = []
    for (let i = 0; i < rest.length; i += 2) {
      if (rest[i] === '--lease-seconds') leaseMs = Number(rest[i + 1]) * 1000
      else if (rest[i] === '--max-seconds') maxDurationMs = Number(rest[i + 1]) * 1000
      else candidate.push(rest[i], rest[i + 1])
    }
    return startRecordingJob({ args: candidate, leaseMs, maxDurationMs })
  }
  if (action === 'status' && rest.length === 0) return recordingJobStatus()
  if (rest.length !== 1)
    throw new Error('Usage: recording-job.mjs start --scenario PATH | status|renew|stop JOB_ID')
  const id = rest[0]
  if (action === 'status') return recordingJobStatus({ id })
  if (action === 'renew') return renewRecordingJob({ id })
  if (action === 'stop') return stopRecordingJob({ id })
  if (action === 'worker') {
    const directory = jobPath({ id })
    const config = await readJSON({ file: path.join(directory, 'config.json') })
    const state = await recordingJobStatus({ id })
    return superviseRecordingJob({
      directory,
      command: process.execPath,
      args: [
        fileURLToPath(new URL('./prepare-demo.mjs', import.meta.url)),
        'candidate',
        ...config.args,
        '--output',
        state.output,
      ],
      maxDurationMs: config.maxDurationMs,
    })
  }
  throw new Error(`Unknown recording job action: ${action}`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await main({ args: process.argv.slice(2) })))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
