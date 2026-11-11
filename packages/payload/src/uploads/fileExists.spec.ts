import { afterEach, describe, expect, it, vi } from 'vitest'

import { fileExists } from './fileExists.js'

const mocks = vi.hoisted(() => ({ stat: vi.fn() }))

vi.mock('fs/promises', () => ({ default: { stat: mocks.stat } }))

afterEach(() => vi.resetAllMocks())

describe('fileExists', () => {
  it('should return false only for missing files', async () => {
    mocks.stat.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }))
    await expect(fileExists('/uploads/missing')).resolves.toBe(false)
  })

  it('should propagate filesystem errors other than missing files', async () => {
    const error = Object.assign(new Error('permission denied'), { code: 'EACCES' })

    mocks.stat.mockRejectedValue(error)
    await expect(fileExists('/uploads/protected')).rejects.toBe(error)
  })

  it('should return true for existing files', async () => {
    mocks.stat.mockResolvedValue({})
    await expect(fileExists('/uploads/existing')).resolves.toBe(true)
  })
})
