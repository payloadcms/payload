import { describe, expect, it, vi } from 'vitest'

import type { UploadProgress } from '../../providers/DocumentInfo/types.js'

import { trackSaveUploadProgress } from './trackSaveUploadProgress.js'

describe('trackSaveUploadProgress', () => {
  it('should start uploading with nothing sent', () => {
    const onChange = vi.fn()

    trackSaveUploadProgress({ onChange, totalBytes: 100 })

    expect(onChange).toHaveBeenCalledWith({ loadedBytes: 0, status: 'uploading', totalBytes: 100 })
  })

  it('should update state only when the whole percent changes', () => {
    const onChange = vi.fn()
    const upload = trackSaveUploadProgress({ onChange, totalBytes: 1000 })

    onChange.mockClear()
    upload.report({ loadedBytes: 100, totalBytes: 1000 })
    upload.report({ loadedBytes: 105, totalBytes: 1000 })
    upload.report({ loadedBytes: 200, totalBytes: 1000 })

    expect(onChange.mock.calls.map(([progress]) => progress.loadedBytes)).toEqual([100, 200])
  })

  it('should settle once, keeping the bytes sent when the save fails', () => {
    const states: UploadProgress[] = []
    const upload = trackSaveUploadProgress({
      onChange: (progress) => states.push(progress),
      totalBytes: 100,
    })

    upload.report({ loadedBytes: 40, totalBytes: 100 })
    upload.settle({ isSuccessful: false })
    upload.settle({ isSuccessful: true })
    upload.report({ loadedBytes: 90, totalBytes: 100 })

    expect(states.at(-1)).toEqual({ loadedBytes: 40, status: 'failed', totalBytes: 100 })
    expect(states).toHaveLength(3)
  })

  it('should report success with every byte sent', () => {
    const onChange = vi.fn()
    const upload = trackSaveUploadProgress({ onChange, totalBytes: 100 })

    upload.settle({ isSuccessful: true })

    expect(onChange).toHaveBeenLastCalledWith({
      loadedBytes: 100,
      status: 'success',
      totalBytes: 100,
    })
  })

  it('should return the last state from stop when a save ends without a result', () => {
    const onChange = vi.fn()
    const upload = trackSaveUploadProgress({ onChange, totalBytes: 100 })

    upload.report({ loadedBytes: 40, totalBytes: 100 })

    const lastState = onChange.mock.lastCall?.[0]

    expect(upload.stop()).toBe(lastState)

    onChange.mockClear()
    upload.report({ loadedBytes: 90, totalBytes: 100 })
    upload.settle({ isSuccessful: true })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should return nothing from stop after the save settled', () => {
    const upload = trackSaveUploadProgress({ totalBytes: 100 })

    upload.settle({ isSuccessful: true })

    expect(upload.stop()).toBeUndefined()
  })
})
