import type { CliArgs, ProjectTemplate } from '../types.js'

import { describe, expect, it } from 'vitest'

import { applyYesDefaults } from './apply-yes-defaults.js'

const templates: ProjectTemplate[] = [
  { name: 'blank', type: 'starter', url: 'x' },
  { name: 'with-cloudflare-d1', type: 'starter', dbType: 'd1-sqlite', url: 'x' },
  { name: 'plugin', type: 'plugin', url: 'x' },
]

function makeArgs(overrides: Record<string, unknown> = {}): CliArgs {
  return { _: [], ...overrides } as unknown as CliArgs
}

describe('applyYesDefaults', () => {
  it('should be a no-op when --yes is not set', () => {
    const args = makeArgs({ _: ['my-app'], '--db': 'sqlite' })
    const result = applyYesDefaults(args, templates)
    expect(result['--template']).toBeUndefined()
    expect(result['--no-agent']).toBeUndefined()
  })

  it('should default --template to blank and set --no-agent', () => {
    const args = makeArgs({ _: ['my-app'], '--db': 'sqlite', '--yes': true })
    const result = applyYesDefaults(args, templates)
    expect(result['--template']).toBe('blank')
    expect(result['--no-agent']).toBe(true)
  })

  it('should not override an explicit --template or --agent', () => {
    const args = makeArgs({
      _: ['my-app'],
      '--agent': 'claude',
      '--db': 'sqlite',
      '--template': 'website',
      '--yes': true,
    })
    const result = applyYesDefaults(args, templates)
    expect(result['--template']).toBe('website')
    expect(result['--no-agent']).toBeUndefined()
  })

  it('should not default --template when --example is set', () => {
    const args = makeArgs({ _: ['my-app'], '--example': 'custom-server', '--yes': true })
    const result = applyYesDefaults(args, templates)
    expect(result['--template']).toBeUndefined()
  })

  it('should accept "." as a valid project name', () => {
    const args = makeArgs({ _: ['.'], '--db': 'sqlite', '--yes': true })
    expect(() => applyYesDefaults(args, templates)).not.toThrow()
  })

  it('should throw when no project name is given', () => {
    const args = makeArgs({ '--db': 'sqlite', '--yes': true })
    expect(() => applyYesDefaults(args, templates)).toThrow(/project name/)
  })

  it('should throw when a blank starter template has no --db', () => {
    const args = makeArgs({ _: ['my-app'], '--yes': true })
    expect(() => applyYesDefaults(args, templates)).toThrow(/--db/)
  })

  it('should not require --db when the template pins a dbType', () => {
    const args = makeArgs({ _: ['my-app'], '--template': 'with-cloudflare-d1', '--yes': true })
    expect(() => applyYesDefaults(args, templates)).not.toThrow()
  })

  it('should not require --db for a plugin template', () => {
    const args = makeArgs({ _: ['my-app'], '--template': 'plugin', '--yes': true })
    expect(() => applyYesDefaults(args, templates)).not.toThrow()
  })

  it('should not require --db when --example is used', () => {
    const args = makeArgs({ _: ['my-app'], '--example': 'custom-server', '--yes': true })
    expect(() => applyYesDefaults(args, templates)).not.toThrow()
  })
})
