import { describe, expect, it } from 'vitest'

import { getScriptArgs } from './getScriptArgs.js'

describe('getScriptArgs', () => {
  const script = 'run'

  it('forwards positional arguments', () => {
    expect(
      getScriptArgs({ argv: ['run', './seed.ts', 'first'], script, scriptPath: './seed.ts' }),
    ).toStrictEqual(['first'])
  })

  it('forwards flags, which minimist would otherwise consume', () => {
    expect(
      getScriptArgs({ argv: ['run', './seed.ts', '--pre'], script, scriptPath: './seed.ts' }),
    ).toStrictEqual(['--pre'])
  })

  it('forwards flags and their values in the order they were typed', () => {
    expect(
      getScriptArgs({
        argv: ['run', './seed.ts', 'first', '--locale', 'en', '--pre'],
        script,
        scriptPath: './seed.ts',
      }),
    ).toStrictEqual(['first', '--locale', 'en', '--pre'])
  })

  it('returns no arguments when the script was passed none', () => {
    expect(
      getScriptArgs({ argv: ['run', './seed.ts'], script, scriptPath: './seed.ts' }),
    ).toStrictEqual([])
  })

  it('keeps arguments that precede the command out of the script', () => {
    expect(
      getScriptArgs({
        argv: ['--cron', '* * * * *', 'run', './seed.ts', '--pre'],
        script,
        scriptPath: './seed.ts',
      }),
    ).toStrictEqual(['--pre'])
  })

  it('ignores a value identical to the script path that precedes the command', () => {
    expect(
      getScriptArgs({
        argv: ['--config', './seed.ts', 'run', './seed.ts', '--pre'],
        script,
        scriptPath: './seed.ts',
      }),
    ).toStrictEqual(['--pre'])
  })

  it('matches the command case-insensitively, as the bin lowercases it', () => {
    expect(
      getScriptArgs({ argv: ['RUN', './seed.ts', '--pre'], script, scriptPath: './seed.ts' }),
    ).toStrictEqual(['--pre'])
  })

  it('returns no arguments when the script path is absent', () => {
    expect(getScriptArgs({ argv: ['run'], script, scriptPath: './seed.ts' })).toStrictEqual([])
  })
})
