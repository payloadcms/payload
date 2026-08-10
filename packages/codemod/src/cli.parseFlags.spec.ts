import { describe, expect, it } from 'vitest'

import { parseFlags } from './cli.parseFlags.js'

describe('parseFlags', () => {
  it('defaults path to cwd when no positional arg is given', () => {
    expect(parseFlags([])).toEqual({
      dry: false,
      list: false,
      path: process.cwd(),
      print: false,
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
})
