import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the skill source relative to this file so behavior is independent of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILL_SRC = path.resolve(__dirname, '../../../tools/claude-plugin/skills/payload')

export async function materialize({ starterConfig }: { starterConfig: string }): Promise<string> {
  const workdir = await mkdtemp(path.join(os.tmpdir(), 'payload-eval-'))
  await writeFile(path.join(workdir, 'payload.config.ts'), starterConfig, 'utf-8')
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
