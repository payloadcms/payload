import { describe, expect, it } from 'vitest'

import { detectPackageManager } from './detectPackageManager.js'

const existsFor = (present: string[]) => (path: string) =>
  present.some((name) => path.endsWith(name))

describe('detectPackageManager', () => {
  it('detects pnpm', () => {
    expect(detectPackageManager('/p', existsFor(['pnpm-lock.yaml']))).toBe('pnpm')
  })

  it('detects yarn', () => {
    expect(detectPackageManager('/p', existsFor(['yarn.lock']))).toBe('yarn')
  })

  it('detects bun', () => {
    expect(detectPackageManager('/p', existsFor(['bun.lock']))).toBe('bun')
  })

  it('detects bun via bun.lockb', () => {
    expect(detectPackageManager('/p', existsFor(['bun.lockb']))).toBe('bun')
  })

  it('detects npm', () => {
    expect(detectPackageManager('/p', existsFor(['package-lock.json']))).toBe('npm')
  })

  it('defaults to npm when no lockfile exists', () => {
    expect(detectPackageManager('/p', () => false)).toBe('npm')
  })

  it('prefers pnpm when multiple lockfiles exist', () => {
    expect(detectPackageManager('/p', existsFor(['pnpm-lock.yaml', 'yarn.lock']))).toBe('pnpm')
  })
})
