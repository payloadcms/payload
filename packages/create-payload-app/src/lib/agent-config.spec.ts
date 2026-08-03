import { describe, expect, it } from 'vitest'

import { buildAgentConfigFile } from './agent-config.js'

describe('buildAgentConfigFile', () => {
  it('should write CLAUDE.md with a Claude Code heading for the claude agent', () => {
    const { content, fileName } = buildAgentConfigFile('claude')

    expect(fileName).toBe('CLAUDE.md')
    expect(content).toContain('# Claude Code')
  })

  it.each(['codex', 'cursor'] as const)(
    'should write AGENTS.md with an Agents heading for %s',
    (agent) => {
      const { content, fileName } = buildAgentConfigFile(agent)

      expect(fileName).toBe('AGENTS.md')
      expect(content).toContain('# Agents')
    },
  )

  it.each(['claude', 'codex', 'cursor'] as const)(
    'should point %s at the skill inside node_modules rather than a local copy',
    (agent) => {
      const { content } = buildAgentConfigFile(agent)

      expect(content).toContain('node_modules/payload/skills/payload/')
      expect(content).toContain('node_modules/payload/skills/payload/SKILL.md')
      expect(content).toContain('node_modules/payload/skills/payload/reference/')
      expect(content).not.toContain('.claude/skills')
    },
  )
})
