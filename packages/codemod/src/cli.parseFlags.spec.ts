import { describe, expect, it } from 'vitest'

import { parseFlags } from './cli.parseFlags.js'

describe('parseFlags', () => {
  it('defaults path to cwd when no positional arg is given', () => {
    expect(parseFlags([])).toEqual({
      agent: undefined,
      command: undefined,
      dry: false,
      force: false,
      list: false,
      path: process.cwd(),
      print: false,
      tag: undefined,
      transform: undefined,
      upgrade: undefined,
    })
  })

  it('reads positional path', () => {
    expect(parseFlags(['./src']).path).toBe('./src')
  })

  it('parses flags', () => {
    expect(parseFlags(['./src', '--dry', '--print'])).toMatchObject({
      dry: true,
      path: './src',
      print: true,
    })
  })

  it('parses --transform', () => {
    expect(parseFlags(['--transform', 'rename-slate-export'])).toMatchObject({
      transform: 'rename-slate-export',
    })
  })

  it('parses --list', () => {
    expect(parseFlags(['--list']).list).toBe(true)
  })

  it('treats --dry-run as an alias for --dry', () => {
    expect(parseFlags(['--dry-run']).dry).toBe(true)
  })

  it('treats a bare upgrade as the dispatch verb with default path', () => {
    expect(parseFlags(['upgrade'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
      upgrade: 'dispatch',
    })
  })

  it('reads --agent on a bare upgrade', () => {
    expect(parseFlags(['upgrade', '--agent', 'claude'])).toMatchObject({
      agent: 'claude',
      command: 'upgrade',
      upgrade: 'dispatch',
    })
  })

  it('parses `upgrade run` with tag, force, and dry, always operating on cwd', () => {
    expect(parseFlags(['upgrade', 'run', '--tag', 'latest', '--force', '--dry'])).toMatchObject({
      command: 'upgrade',
      dry: true,
      force: true,
      path: process.cwd(),
      tag: 'latest',
      upgrade: 'run',
    })
  })

  it('parses `upgrade run` on cwd', () => {
    expect(parseFlags(['upgrade', 'run'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
      upgrade: 'run',
    })
  })

  it('parses `upgrade prompt` on cwd', () => {
    expect(parseFlags(['upgrade', 'prompt'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
      upgrade: 'prompt',
    })
  })

  it('ignores a stray positional after an upgrade verb and stays on cwd', () => {
    expect(parseFlags(['upgrade', 'run', './app'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
      upgrade: 'run',
    })
  })

  it('treats a bare upgrade as dispatch, not a mechanical run', () => {
    expect(parseFlags(['upgrade'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
      upgrade: 'dispatch',
    })
  })

  it('leaves command undefined for a bare path invocation', () => {
    expect(parseFlags(['./src', '--dry'])).toMatchObject({
      command: undefined,
      dry: true,
      path: './src',
      upgrade: undefined,
    })
  })
})
