import { describe, expect, it } from 'vitest'

import { buildAgentConfigFiles } from './agent-config.js'

describe('buildAgentConfigFiles', () => {
  it('should write only AGENTS.md', () => {
    const fileNames = buildAgentConfigFiles().map((file) => file.fileName)

    expect(fileNames).toEqual(['AGENTS.md'])
  })

  it('should point AGENTS.md at the skill inside node_modules', () => {
    const agents = buildAgentConfigFiles().find((file) => file.fileName === 'AGENTS.md')

    expect(agents?.content).toContain('# AI Agent')
    expect(agents?.content).toContain('node_modules/payload/skills/payload/SKILL.md')
    expect(agents?.content).not.toContain('.claude/skills')
  })
})
