import { describe, expect, it } from 'vitest'

import { parseFlags } from './cli.parseFlags.js'

describe('parseFlags', () => {
  it('defaults path to cwd when no positional arg is given', () => {
    expect(parseFlags([])).toEqual({
      command: undefined,
      dry: false,
      force: false,
      list: false,
      path: process.cwd(),
      print: false,
      tag: undefined,
      transform: undefined,
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

  it('parses the upgrade subcommand with default path', () => {
    expect(parseFlags(['upgrade'])).toMatchObject({
      command: 'upgrade',
      path: process.cwd(),
    })
  })

  it('parses upgrade with path, tag, force, and dry', () => {
    expect(parseFlags(['upgrade', './app', '--tag', 'latest', '--force', '--dry'])).toMatchObject({
      command: 'upgrade',
      dry: true,
      force: true,
      path: './app',
      tag: 'latest',
    })
  })

  it('leaves command undefined for a bare path invocation', () => {
    expect(parseFlags(['./src', '--dry'])).toMatchObject({
      command: undefined,
      dry: true,
      path: './src',
    })
  })
})
