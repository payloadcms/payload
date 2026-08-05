import { describe, expect, it } from 'vitest'

import { buildAgentConfigFile } from './agent-config.js'

describe('buildAgentConfigFile', () => {
  it('should write CLAUDE.md for the claude agent', () => {
    expect(buildAgentConfigFile('claude').fileName).toBe('CLAUDE.md')
  })

  it.each(['codex', 'cursor'] as const)('should write AGENTS.md for %s', (agent) => {
    expect(buildAgentConfigFile(agent).fileName).toBe('AGENTS.md')
  })

  it.each(['claude', 'codex', 'cursor'] as const)(
    'should use an agent-neutral heading for %s',
    (agent) => {
      const { content } = buildAgentConfigFile(agent)

      expect(content).toContain('# AI Agent')
      expect(content).not.toContain('Claude Code')
    },
  )

  it.each(['claude', 'codex', 'cursor'] as const)(
    'should point %s at the skill inside node_modules rather than a local copy',
    (agent) => {
      const { content } = buildAgentConfigFile(agent)

      expect(content).toContain('node_modules/payload/skills/payload/')
      expect(content).not.toContain('.claude/skills')
    },
  )
})
