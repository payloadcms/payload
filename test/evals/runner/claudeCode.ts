import { spawn, spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { copyFile, mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import pLimit from 'p-limit'

import type { CodegenRunnerResult, TokenUsage, TranscriptEvent } from '../types.js'
import type { CodegenRunner, CodegenRunnerOptions } from './types.js'

import { cleanup, gitInit, installSkill, materialize, readEntry } from './workdir.js'

const DEFAULT_AGENT_MODEL = 'claude-opus-4-6'
const DEFAULT_TIMEOUT_MS = 600_000
const PROMPT_SUFFIX =
  'IMPORTANT: Do not run package managers (npm, pnpm, yarn) or build/test/dev commands. Modify only payload.config.ts. Just write the file.'

export const SKILL_SYSTEM_PROMPT =
  'A `payload` skill is available in this workdir under .claude/skills/payload/. You MUST invoke it via the Skill tool before modifying payload.config.ts. The skill provides authoritative reference for collections, fields, hooks, access control, and other Payload CMS patterns.'

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
    const appendSystemPrompt = skillInstall === 'embedded' ? SKILL_SYSTEM_PROMPT : undefined
    const { exitCode, stderr, transcript, usage } = await spawnAgent({
      agentModel,
      appendSystemPrompt,
      prompt,
      sandboxDir: init.sandboxDir,
      timeoutMs,
      workdir,
    })

    const modifiedConfig = exitCode === 0 ? await readEntry(workdir) : starterConfig

    const result: CodegenRunnerResult = {
      agentExitCode: exitCode,
      agentLog: stderr.length > 0 ? truncate(stderr, 10_000) : undefined,
      confidence: 0,
      modifiedConfig,
      transcript: capTranscript(transcript),
      usage: usage ?? zeroUsage(),
    }
    return result
  } finally {
    await cleanup(workdir)
  }
}

async function spawnAgent({
  agentModel,
  appendSystemPrompt,
  prompt,
  sandboxDir,
  timeoutMs,
  workdir,
}: {
  agentModel: string
  appendSystemPrompt?: string
  prompt: string
  sandboxDir: string
  timeoutMs: number
  workdir: string
}): Promise<{
  exitCode: number
  stderr: string
  transcript: TranscriptEvent[]
  usage?: TokenUsage
}> {
  const args = [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    agentModel,
    '--dangerously-skip-permissions',
  ]
  if (appendSystemPrompt) {
    args.push('--append-system-prompt', appendSystemPrompt)
  }
  args.push(prompt)
  return new Promise((resolve) => {
    const child = spawn('claude', args, {
      cwd: workdir,
      // detached so timeout can kill the whole process group via -pid;
      // otherwise grandchild processes (agent's tool subprocesses) leak.
      detached: true,
      env: { ...process.env, CLAUDE_CONFIG_DIR: sandboxDir },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const transcript: TranscriptEvent[] = []
    let usage: TokenUsage | undefined
    let stdoutBuffer = ''
    let stderr = ''
    const ingestLine = (line: string) => {
      if (line.trim().length === 0) {
        return
      }
      const { events, usage: lineUsage } = parseStreamJsonLine(line)
      for (const event of events) {
        transcript.push(event)
      }
      if (lineUsage) {
        usage = lineUsage
      }
    }
    child.stdout.on('data', (b: Buffer) => {
      stdoutBuffer += b.toString()
      const newlineIdx = stdoutBuffer.lastIndexOf('\n')
      if (newlineIdx === -1) {
        return
      }
      const complete = stdoutBuffer.slice(0, newlineIdx)
      stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1)
      for (const line of complete.split('\n')) {
        ingestLine(line)
      }
    })
    child.stderr.on('data', (b: Buffer) => {
      stderr += b.toString()
    })
    let resolved = false
    const finish = (result: {
      exitCode: number
      stderr: string
      transcript: TranscriptEvent[]
      usage?: TokenUsage
    }) => {
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
        stderr += `\n[runner] process-group kill failed: ${(groupKillErr as Error).message}`
        try {
          child.kill('SIGKILL')
        } catch (childKillErr) {
          stderr += `\n[runner] child.kill fallback also failed: ${(childKillErr as Error).message}`
        }
      }
      stderr += `\n[runner] killed after ${timeoutMs}ms timeout`
      finish({ exitCode: -1, stderr, transcript, usage })
    }, timeoutMs)
    child.on('error', (err) => {
      clearTimeout(timer)
      stderr += `\n[runner] spawn error: ${err.message}`
      finish({ exitCode: -1, stderr, transcript, usage })
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      if (stdoutBuffer.length > 0) {
        ingestLine(stdoutBuffer)
        stdoutBuffer = ''
      }
      finish({ exitCode: code ?? -1, stderr, transcript, usage })
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

const TEXT_TRUNCATE_LIMIT = 4_000
const TRANSCRIPT_EVENT_CAP = 200

type ParsedStreamLine = { events: TranscriptEvent[]; usage?: TokenUsage }

function parseStreamJsonLine(line: string): ParsedStreamLine {
  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch {
    return { events: [] }
  }
  if (parsed === null || typeof parsed !== 'object') {
    return { events: [] }
  }
  const event = parsed as { message?: unknown; type?: string; usage?: unknown }
  if (event.type === 'assistant') {
    return { events: extractAssistantBlocks(event.message) }
  }
  if (event.type === 'user') {
    return { events: extractUserBlocks(event.message) }
  }
  if (event.type === 'result') {
    return { events: [], usage: extractResultUsage(event.usage) }
  }
  return { events: [] }
}

function extractResultUsage(raw: unknown): TokenUsage | undefined {
  if (raw === null || typeof raw !== 'object') {
    return undefined
  }
  const u = raw as {
    cache_creation_input_tokens?: unknown
    cache_read_input_tokens?: unknown
    input_tokens?: unknown
    output_tokens?: unknown
  }
  const inputTokens = asNumber(u.input_tokens) + asNumber(u.cache_creation_input_tokens)
  const cachedInputTokens = asNumber(u.cache_read_input_tokens)
  const outputTokens = asNumber(u.output_tokens)
  return {
    cachedInputTokens,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + cachedInputTokens + outputTokens,
  }
}

function asNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function extractAssistantBlocks(message: unknown): TranscriptEvent[] {
  const content = getContentArray(message)
  const events: TranscriptEvent[] = []
  for (const raw of content) {
    if (raw === null || typeof raw !== 'object') {
      continue
    }
    const block = raw as {
      id?: unknown
      input?: unknown
      name?: unknown
      text?: unknown
      thinking?: unknown
      type?: unknown
    }
    if (block.type === 'text' && typeof block.text === 'string') {
      events.push({ text: truncateText(block.text), type: 'text' })
      continue
    }
    if (block.type === 'thinking' && typeof block.thinking === 'string') {
      events.push({ text: truncateText(block.thinking), type: 'thinking' })
      continue
    }
    if (
      block.type === 'tool_use' &&
      typeof block.id === 'string' &&
      typeof block.name === 'string'
    ) {
      events.push({
        id: block.id,
        input: normalizeToolInput(block.input),
        name: block.name,
        type: 'tool_use',
      })
    }
  }
  return events
}

function extractUserBlocks(message: unknown): TranscriptEvent[] {
  const content = getContentArray(message)
  const events: TranscriptEvent[] = []
  for (const raw of content) {
    if (raw === null || typeof raw !== 'object') {
      continue
    }
    const block = raw as {
      content?: unknown
      is_error?: unknown
      tool_use_id?: unknown
      type?: unknown
    }
    if (block.type !== 'tool_result' || typeof block.tool_use_id !== 'string') {
      continue
    }
    events.push({
      content: normalizeToolResultContent(block.content),
      isError: block.is_error === true ? true : undefined,
      toolUseId: block.tool_use_id,
      type: 'tool_result',
    })
  }
  return events
}

function getContentArray(message: unknown): unknown[] {
  if (message === null || typeof message !== 'object') {
    return []
  }
  const content = (message as { content?: unknown }).content
  return Array.isArray(content) ? content : []
}

function normalizeToolInput(input: unknown): unknown {
  if (input === undefined) {
    return {}
  }
  const serialized = JSON.stringify(input)
  if (typeof serialized === 'string' && serialized.length > TEXT_TRUNCATE_LIMIT) {
    return { __truncated: true, preview: `${serialized.slice(0, TEXT_TRUNCATE_LIMIT)}…` }
  }
  return input
}

function normalizeToolResultContent(content: unknown): string {
  if (typeof content === 'string') {
    return truncateText(content)
  }
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (part !== null && typeof part === 'object') {
          const text = (part as { text?: unknown }).text
          if (typeof text === 'string') {
            return text
          }
        }
        return ''
      })
      .join('')
    return truncateText(joined)
  }
  return ''
}

function truncateText(s: string): string {
  return s.length <= TEXT_TRUNCATE_LIMIT ? s : `${s.slice(0, TEXT_TRUNCATE_LIMIT)}… [truncated]`
}

function capTranscript(events: TranscriptEvent[]): TranscriptEvent[] {
  if (events.length <= TRANSCRIPT_EVENT_CAP) {
    return events
  }
  const head = events.slice(0, 100)
  const tail = events.slice(events.length - 100)
  const omitted = events.length - 200
  const marker: TranscriptEvent = {
    text: `… [transcript truncated: ${omitted} events omitted]`,
    type: 'text',
  }
  return [...head, marker, ...tail]
}
