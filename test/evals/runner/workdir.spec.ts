import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  appendAuditEvent,
  AUDIT_LOG_PATH_ENV,
  finalizeAudit,
  readAudit,
} from '../../__helpers/plugins/audit/index.js'
import { MCP_EVAL_DATABASE_URL_ENV } from '../mcpDatabase.js'
import {
  cleanup,
  getAuditPath,
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

  it('configures one audit.json for the agent and MCP server', async () => {
    const mcpDatabaseURL = 'file:///tmp/payload-mcp-eval-case-123/database.sqlite'
    const workdir = await materialize({
      configPath: 'mcp/shared',
      exposeMcpTools: true,
      mcpConfigPath: '/tmp/frozen-payload.config.ts',
      mcpDatabaseURL,
      starterConfig: 'x',
    })
    created.push(workdir)
    const mcpConfig = JSON.parse(readFileSync(path.join(workdir, '.mcp.json'), 'utf8')) as {
      mcpServers: { payload: { env: Record<string, string> } }
    }

    const auditPath = getAuditPath(workdir)

    expect(path.basename(auditPath)).toBe('audit.json')
    expect(mcpConfig.mcpServers.payload.env[AUDIT_LOG_PATH_ENV]).toBe(auditPath)
    expect(mcpConfig.mcpServers.payload.env[MCP_EVAL_DATABASE_URL_ENV]).toBe(mcpDatabaseURL)
    expect(mcpConfig.mcpServers.payload.env.PAYLOAD_CONFIG_PATH).toBe(
      '/tmp/frozen-payload.config.ts',
    )
    expect(mcpConfig.mcpServers.payload.env.PAYLOAD_FORCE_DRIZZLE_PUSH).toBe('true')
    expect(mcpConfig.mcpServers.payload.env.PAYLOAD_MCP_EVAL_LOG_PATH).toBeUndefined()
    expect(mcpConfig.mcpServers.payload.env.PAYLOAD_MCP_EVAL_OPERATION_LOG_PATH).toBeUndefined()
    expect(readFileSync(path.join(workdir, '.codex', 'config.toml'), 'utf8')).toContain(
      `${AUDIT_LOG_PATH_ENV} = ${JSON.stringify(auditPath)}`,
    )
    expect(readFileSync(path.join(workdir, '.codex', 'config.toml'), 'utf8')).toContain(
      `${MCP_EVAL_DATABASE_URL_ENV} = ${JSON.stringify(mcpDatabaseURL)}`,
    )
  })

  it('requires a per-case database for MCP workdirs', async () => {
    await expect(
      materialize({
        configPath: 'mcp/shared',
        exposeMcpTools: true,
        starterConfig: 'x',
      }),
    ).rejects.toThrow('per-case database URL')
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

  it('reads one ordered flat array through the audit plugin', async () => {
    const workdir = await materialize({ starterConfig: 'x' })
    created.push(workdir)
    const auditPath = getAuditPath(workdir)

    appendAuditEvent({
      event: {
        slug: 'articles',
        type: 'payload-operation',
        blocked: false,
        entityType: 'collection',
        operation: 'read',
        payloadAPI: 'MCP',
      },
      path: auditPath,
    })
    appendAuditEvent({
      event: {
        name: 'findDocuments',
        type: 'mcp-tool-call',
        input: { collectionSlug: 'articles' },
        response: { content: [{ type: 'text', text: 'Found it' }] },
      },
      path: auditPath,
    })

    expect(readAudit({ path: auditPath })).toEqual([
      {
        slug: 'articles',
        type: 'payload-operation',
        blocked: false,
        entityType: 'collection',
        operation: 'read',
        payloadAPI: 'MCP',
      },
      {
        name: 'findDocuments',
        type: 'mcp-tool-call',
        input: { collectionSlug: 'articles' },
        response: { content: [{ type: 'text', text: 'Found it' }] },
      },
    ])
    finalizeAudit({ path: auditPath })
    expect(JSON.parse(readFileSync(auditPath, 'utf8'))).toHaveLength(2)
  })

  it('returns an empty audit when no events were recorded', async () => {
    const workdir = await materialize({ starterConfig: 'x' })
    created.push(workdir)

    expect(readAudit({ path: getAuditPath(workdir) })).toEqual([])
  })

  it('getSkillTreeHash is stable and 8 hex chars', () => {
    const a = getSkillTreeHash()
    const b = getSkillTreeHash()
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{8}$/)
  })
})
