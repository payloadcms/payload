import { spawn, spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { copyFile, mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import pLimit from 'p-limit'

import type { CodegenRunnerResult, TokenUsage } from '../types.js'
import type { CodegenRunner, CodegenRunnerOptions } from './types.js'

import { cleanup, gitInit, installSkill, materialize, readEntry } from './workdir.js'

const DEFAULT_AGENT_MODEL = 'claude-opus-4-6'
const DEFAULT_TIMEOUT_MS = 600_000
const PROMPT_SUFFIX =
  'IMPORTANT: Do not run package managers (npm, pnpm, yarn) or build/test/dev commands. Modify only payload.config.ts. Just write the file.'

const limit = pLimit(Number(process.env.EVAL_AGENT_CONCURRENCY ?? '2'))

let initPromise: null | Promise<{ sandboxDir: string; version: string }> = null

export const claudeCodeRunner: CodegenRunner = {
  async run(instruction, starterConfig, options) {
    return limit(() => runOne(instruction, starterConfig, options))
  },
}

export async function getAgentVersion(): Promise<string> {
  const init = await ensureInit()
  return init.version
}

async function runOne(
  instruction: string,
  starterConfig: string,
  options: CodegenRunnerOptions,
): Promise<CodegenRunnerResult> {
  const {
    agentModel = DEFAULT_AGENT_MODEL,
    skillInstall = 'embedded',
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options
  const init = await ensureInit()

  const workdir = await materialize({ starterConfig })
  assertSafeWorkdir(workdir)
  try {
    gitInit(workdir)
    await installSkill({ mode: skillInstall, workdir })

    const prompt = `${instruction}\n\n${PROMPT_SUFFIX}`
    const { exitCode, log } = await spawnAgent({
      agentModel,
      prompt,
      sandboxDir: init.sandboxDir,
      timeoutMs,
      workdir,
    })

    const modifiedConfig = exitCode === 0 ? await readEntry(workdir) : starterConfig

    const result: CodegenRunnerResult = {
      agentExitCode: exitCode,
      agentLog: truncate(log, 10_000),
      confidence: 0,
      modifiedConfig,
      usage: zeroUsage(),
    }
    return result
  } finally {
    await cleanup(workdir)
  }
}

async function spawnAgent({
  agentModel,
  prompt,
  sandboxDir,
  timeoutMs,
  workdir,
}: {
  agentModel: string
  prompt: string
  sandboxDir: string
  timeoutMs: number
  workdir: string
}): Promise<{ exitCode: number; log: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      'claude',
      ['--print', '--model', agentModel, '--dangerously-skip-permissions', prompt],
      {
        cwd: workdir,
        // detached so timeout can kill the whole process group via -pid;
        // otherwise grandchild processes (agent's tool subprocesses) leak.
        detached: true,
        env: { ...process.env, CLAUDE_CONFIG_DIR: sandboxDir },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    let log = ''
    child.stdout.on('data', (b: Buffer) => {
      log += b.toString()
    })
    child.stderr.on('data', (b: Buffer) => {
      log += b.toString()
    })
    let resolved = false
    const finish = (result: { exitCode: number; log: string }) => {
      if (resolved) {
        return
      }
      resolved = true
      resolve(result)
    }
    const timer = setTimeout(() => {
      try {
        if (child.pid !== undefined) {
          process.kill(-child.pid, 'SIGKILL')
        } else {
          child.kill('SIGKILL')
        }
      } catch (groupKillErr) {
        log += `\n[runner] process-group kill failed: ${(groupKillErr as Error).message}`
        try {
          child.kill('SIGKILL')
        } catch (childKillErr) {
          log += `\n[runner] child.kill fallback also failed: ${(childKillErr as Error).message}`
        }
      }
      log += `\n[runner] killed after ${timeoutMs}ms timeout`
      finish({ exitCode: -1, log })
    }, timeoutMs)
    child.on('error', (err) => {
      clearTimeout(timer)
      log += `\n[runner] spawn error: ${err.message}`
      finish({ exitCode: -1, log })
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      finish({ exitCode: code ?? -1, log })
    })
  })
}

async function ensureInit(): Promise<{ sandboxDir: string; version: string }> {
  if (initPromise === null) {
    initPromise = initOnce().catch((err: unknown) => {
      // Reset so the next caller retries instead of seeing a cached rejection.
      initPromise = null
      throw err
    })
  }
  return initPromise
}

async function initOnce(): Promise<{ sandboxDir: string; version: string }> {
  const version = captureVersion()
  const sandboxDir = await mkdtemp(path.join(os.tmpdir(), 'payload-eval-claude-config-'))
  process.on('exit', () => {
    try {
      rmSync(sandboxDir, { force: true, recursive: true })
    } catch {
      // best-effort
    }
  })

  const probe = await authProbe(sandboxDir)
  if (!probe.ok) {
    await copyCredentialsInto(sandboxDir)
    const retry = await authProbe(sandboxDir)
    if (!retry.ok) {
      throw new Error(
        `Claude Code authentication failed in sandbox ${sandboxDir}.\n` +
          `Probe stderr: ${retry.stderr.trim() || '(empty)'}\n` +
          `Probe stdout: ${retry.stdout.trim() || '(empty)'}\n` +
          `Fix: run \`claude login\` or set ANTHROPIC_API_KEY in the test shell.`,
      )
    }
  }

  return { sandboxDir, version }
}

function captureVersion(): string {
  const result = spawnSync('claude', ['--version'], { encoding: 'utf-8' })
  if (result.status !== 0) {
    throw new Error(
      'Claude Code CLI not found on PATH. Install from https://docs.anthropic.com/en/docs/claude-code',
    )
  }
  return result.stdout.trim() || 'unknown'
}

async function authProbe(
  sandboxDir: string,
): Promise<{ ok: boolean; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--print', '--model', 'haiku', 'reply with the word ok'], {
      env: { ...process.env, CLAUDE_CONFIG_DIR: sandboxDir },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (b: Buffer) => {
      stdout += b.toString()
    })
    child.stderr.on('data', (b: Buffer) => {
      stderr += b.toString()
    })
    let resolved = false
    const finish = (result: { ok: boolean; stderr: string; stdout: string }) => {
      if (resolved) {
        return
      }
      resolved = true
      resolve(result)
    }
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // child already gone
      }
      finish({ ok: false, stderr: stderr + '\n[probe timeout]', stdout })
    }, 30_000)
    child.on('error', (err) => {
      clearTimeout(timer)
      finish({ ok: false, stderr: stderr + `\n[probe spawn error]: ${err.message}`, stdout })
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      finish({ ok: code === 0, stderr, stdout })
    })
  })
}

async function copyCredentialsInto(sandboxDir: string): Promise<void> {
  const src = path.join(os.homedir(), '.claude', '.credentials.json')
  const dest = path.join(sandboxDir, '.credentials.json')
  try {
    await copyFile(src, dest)
  } catch {
    // probe will throw the actionable error
  }
}

function assertSafeWorkdir(workdir: string): void {
  if (!workdir.startsWith(os.tmpdir())) {
    throw new Error(`Refusing to run agent: workdir ${workdir} not under tmpdir`)
  }
  if (workdir.startsWith(os.homedir())) {
    throw new Error(`Refusing to run agent: workdir ${workdir} under homedir`)
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}\n…[truncated]`
}

function zeroUsage(): TokenUsage {
  return { cachedInputTokens: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 }
}
