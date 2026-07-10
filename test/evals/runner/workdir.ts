import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { AUDIT_LOG_PATH_ENV } from '../../__helpers/plugins/audit/index.js'
import { MCP_EVAL_DATABASE_URL_ENV } from '../mcpDatabase.js'

// Resolve the skill source relative to this file so behavior is independent of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures')
const SKILL_SRC = path.resolve(__dirname, '../../../tools/claude-plugin/skills/payload')
const MCP_BIN = path.resolve(__dirname, '../../../packages/plugin-mcp/bin.js')

export function getAuditPath(workdir: string): string {
  return path.join(workdir, 'audit.json')
}

export async function materialize({
  configPath,
  exposeMcpTools,
  mcpConfigPath,
  mcpDatabaseURL,
  starterConfig,
}: {
  configPath?: string
  /** Write agent configuration that exposes the starter config's Payload MCP tools. */
  exposeMcpTools?: boolean
  /** Absolute path to the frozen config booted by the parent eval process. */
  mcpConfigPath?: string
  mcpDatabaseURL?: string
  starterConfig: string
}): Promise<string> {
  if (exposeMcpTools && configPath && !mcpDatabaseURL) {
    throw new Error('MCP eval workdirs require a per-case database URL')
  }

  const workdir = await mkdtemp(path.join(os.tmpdir(), 'payload-eval-'))
  await writeFile(path.join(workdir, 'payload.config.ts'), starterConfig, 'utf-8')

  if (exposeMcpTools && configPath) {
    const env = {
      [AUDIT_LOG_PATH_ENV]: getAuditPath(workdir),
      ...(mcpDatabaseURL ? { [MCP_EVAL_DATABASE_URL_ENV]: mcpDatabaseURL } : {}),
      NODE_ENV: 'development',
      PAYLOAD_CONFIG_PATH:
        mcpConfigPath ?? path.join(FIXTURES_DIR, configPath, 'payload.config.ts'),
      PAYLOAD_DROP_DATABASE: 'false',
      PAYLOAD_FORCE_DRIZZLE_PUSH: 'true',
      PAYLOAD_MCP_OVERRIDE_ACCESS: 'true',
    }
    const codexDir = path.join(workdir, '.codex')

    await mkdir(codexDir, { recursive: true })
    await Promise.all([
      writeFile(
        path.join(workdir, '.mcp.json'),
        JSON.stringify({
          mcpServers: { payload: { args: [MCP_BIN], command: process.execPath, env } },
        }),
        'utf-8',
      ),
      writeFile(
        path.join(codexDir, 'config.toml'),
        `[mcp_servers.payload]\ncommand = ${JSON.stringify(process.execPath)}\nargs = [${JSON.stringify(MCP_BIN)}]\n\n[mcp_servers.payload.env]\n${Object.entries(
          env,
        )
          .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
          .join('\n')}\n`,
        'utf-8',
      ),
    ])
  }

  return workdir
}

export function gitInit(workdir: string): void {
  run('git', ['init', '-q'], workdir)
  run('git', ['config', '--local', 'user.name', 'Payload Eval Runner'], workdir)
  run('git', ['config', '--local', 'user.email', 'eval@payloadcms.local'], workdir)
  run('git', ['add', '.'], workdir)
  run('git', ['commit', '-q', '--allow-empty', '-m', 'initial'], workdir)
}

export async function installSkill({
  mode,
  workdir,
}: {
  mode: 'embedded' | 'none'
  workdir: string
}): Promise<void> {
  if (mode === 'none') {
    return
  }
  const dest = path.join(workdir, '.claude', 'skills', 'payload')
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(SKILL_SRC, dest, { recursive: true })
}

export async function readEntry(workdir: string): Promise<string> {
  return readFile(path.join(workdir, 'payload.config.ts'), 'utf-8')
}

export async function cleanup(workdir: string): Promise<void> {
  if (process.env.EVAL_KEEP_WORKDIR === '1') {
    return
  }
  await rm(workdir, { force: true, recursive: true })
}

let cachedSkillHash: null | string = null
let cachedMCPEvalConfigHash: null | string = null

export function getMCPEvalConfigHash(): string {
  if (cachedMCPEvalConfigHash === null) {
    cachedMCPEvalConfigHash = createHash('sha256')
      .update(fs.readFileSync(path.join(FIXTURES_DIR, 'mcp', 'buildMCPEvalConfig.ts')))
      .digest('hex')
      .slice(0, 8)
  }

  return cachedMCPEvalConfigHash
}

export function getSkillTreeHash(): string {
  if (cachedSkillHash !== null) {
    return cachedSkillHash
  }
  const hash = createHash('sha256')
  for (const rel of walkSync(SKILL_SRC)) {
    hash.update(rel)
    hash.update('\0')
    hash.update(fs.readFileSync(path.join(SKILL_SRC, rel)))
    hash.update('\0')
  }
  cachedSkillHash = hash.digest('hex').slice(0, 8)
  return cachedSkillHash
}

function run(cmd: string, args: string[], cwd: string): void {
  const result = spawnSync(cmd, args, { cwd, stdio: 'pipe' })
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}: ${result.stderr.toString()}`)
  }
}

function walkSync(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry)
    const rel = prefix ? `${prefix}/${entry}` : entry
    if (fs.statSync(full).isDirectory()) {
      out.push(...walkSync(full, rel))
    } else {
      out.push(rel)
    }
  }
  return out
}
