import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  cleanup,
  getSkillTreeHash,
  gitInit,
  installSkill,
  materialize,
  readEntry,
} from './workdir.js'

describe('workdir helpers', () => {
  const created: string[] = []

  afterEach(async () => {
    for (const dir of created) {
      await cleanup(dir).catch(() => {})
    }
    created.length = 0
  })

  it('materializes a starter config into a tmpdir', async () => {
    const workdir = await materialize({ starterConfig: 'export default {} as any' })
    created.push(workdir)
    expect(workdir.startsWith(os.tmpdir())).toBe(true)
    expect(readFileSync(path.join(workdir, 'payload.config.ts'), 'utf-8')).toBe(
      'export default {} as any',
    )
  })

  it('git-inits with a fixed local identity and an initial commit', async () => {
    const workdir = await materialize({ starterConfig: 'x' })
    created.push(workdir)
    gitInit(workdir)
    expect(existsSync(path.join(workdir, '.git'))).toBe(true)
    const { spawnSync } = await import('node:child_process')
    const userNameResult = spawnSync('git', ['config', '--local', 'user.name'], { cwd: workdir })
    const userName = userNameResult.stdout.toString().trim()
    expect(userName).toBe('Payload Eval Runner')
    const logResult = spawnSync('git', ['log', '--oneline'], { cwd: workdir })
    const log = logResult.stdout.toString()
    expect(log).toMatch(/initial/i)
  })

  it('installSkill copies the whole skill directory in embedded mode', async () => {
    const workdir = await materialize({ starterConfig: 'x' })
    created.push(workdir)
    await installSkill({ mode: 'embedded', workdir })
    const skillBody = await readFile(
      path.join(workdir, '.claude', 'skills', 'payload', 'SKILL.md'),
      'utf-8',
    )
    expect(skillBody.length).toBeGreaterThan(0)
    expect(
      existsSync(path.join(workdir, '.claude', 'skills', 'payload', 'reference', 'FIELDS.md')),
    ).toBe(true)
  })

  it('installSkill is a no-op when mode is none', async () => {
    const workdir = await materialize({ starterConfig: 'x' })
    created.push(workdir)
    await installSkill({ mode: 'none', workdir })
    expect(existsSync(path.join(workdir, '.claude'))).toBe(false)
  })

  it('readEntry returns the current payload.config.ts content', async () => {
    const workdir = await materialize({ starterConfig: 'export const a = 1' })
    created.push(workdir)
    expect(await readEntry(workdir)).toBe('export const a = 1')
  })

  it('getSkillTreeHash is stable and 8 hex chars', () => {
    const a = getSkillTreeHash()
    const b = getSkillTreeHash()
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{8}$/)
  })
})
