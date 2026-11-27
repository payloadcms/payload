import type { TFunction } from '@payloadcms/translations'

import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { UploadProgress } from '../../providers/DocumentInfo/types.js'

import { createProgressToast } from '../../providers/UploadSessions/browser.js'
import { abandonSaveUploadProgress, trackSaveUploadProgress } from './trackSaveUploadProgress.js'

const t = ((key: string, vars?: Record<string, unknown>) =>
  `${key} ${JSON.stringify(vars ?? {})}`) as unknown as TFunction

const toastID = 'save-upload-progress-test'

const getToastTitle = () => toast.getToasts().find(({ id }) => id === toastID)?.title

describe('trackSaveUploadProgress', () => {
  afterEach(() => {
    toast.dismiss(toastID)
  })

  it('should start uploading with nothing sent and keep the toast until bytes are reported', () => {
    const onChange = vi.fn()

    toast.loading('Submitting…', { id: toastID })
    trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange,
      progressToast: createProgressToast({ id: toastID }),
      t,
      totalBytes: 100,
    })

    expect(onChange).toHaveBeenCalledWith({ loadedBytes: 0, status: 'uploading', totalBytes: 100 })
    expect(getToastTitle()).toBe('Submitting…')
  })

  it('should update state and toast only when the whole percent changes', () => {
    const onChange = vi.fn()
    const upload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange,
      progressToast: createProgressToast({ id: toastID }),
      t,
      totalBytes: 1000,
    })

    onChange.mockClear()
    upload.report({ loadedBytes: 100, totalBytes: 1000 })
    upload.report({ loadedBytes: 105, totalBytes: 1000 })
    upload.report({ loadedBytes: 200, totalBytes: 1000 })

    expect(onChange.mock.calls.map(([progress]) => progress.loadedBytes)).toEqual([100, 200])
    expect(getToastTitle()).toBe(
      'upload:uploadingFileProgress {"filename":"video.mp4","percent":20}',
    )
  })

  it('should show processing once every byte is sent', () => {
    const upload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      progressToast: createProgressToast({ id: toastID }),
      t,
      totalBytes: 10,
    })

    upload.report({ loadedBytes: 10, totalBytes: 10 })

    expect(getToastTitle()).toBe('upload:processingAndSavingFile {"filename":"video.mp4"}')
  })

  it('should settle once, keeping the bytes sent when the save fails', () => {
    const states: UploadProgress[] = []
    const upload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange: (progress) => states.push(progress),
      t,
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
    const upload = trackSaveUploadProgress({ fileName: 'video.mp4', onChange, t, totalBytes: 100 })

    upload.settle({ isSuccessful: true })

    expect(onChange).toHaveBeenLastCalledWith({
      loadedBytes: 100,
      status: 'success',
      totalBytes: 100,
    })
  })

  it('should return the last state from stop when a save ends without a result', () => {
    const onChange = vi.fn()
    const upload = trackSaveUploadProgress({ fileName: 'video.mp4', onChange, t, totalBytes: 100 })

    upload.report({ loadedBytes: 40, totalBytes: 100 })

    const lastState = onChange.mock.lastCall?.[0]

    expect(upload.stop()).toBe(lastState)

    onChange.mockClear()
    upload.report({ loadedBytes: 90, totalBytes: 100 })
    upload.settle({ isSuccessful: true })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should return nothing from stop after the save settled', () => {
    const upload = trackSaveUploadProgress({ fileName: 'video.mp4', t, totalBytes: 100 })

    upload.settle({ isSuccessful: true })

    expect(upload.stop()).toBeUndefined()
  })
})

describe('abandonSaveUploadProgress', () => {
  /** Holds `uploadProgress` like `useState`, so updates can depend on the current value. */
  const createProgressState = () => {
    let current: undefined | UploadProgress

    return {
      get: () => current,
      set: (
        update:
          | ((value: undefined | UploadProgress) => undefined | UploadProgress)
          | UploadProgress,
      ) => {
        current = typeof update === 'function' ? update(current) : update
      },
    }
  }

  it('should clear the progress of a save reset while uploading and ignore its later reports', () => {
    const state = createProgressState()
    const upload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange: state.set,
      t,
      totalBytes: 100,
    })

    upload.report({ loadedBytes: 40, totalBytes: 100 })
    abandonSaveUploadProgress({ setUploadProgress: state.set, upload })

    expect(state.get()).toBeUndefined()

    upload.report({ loadedBytes: 90, totalBytes: 100 })
    upload.settle({ isSuccessful: true })

    expect(state.get()).toBeUndefined()
  })

  it('should keep the progress a newer save has reported', () => {
    const state = createProgressState()
    const staleUpload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange: state.set,
      t,
      totalBytes: 100,
    })
    const newerUpload = trackSaveUploadProgress({
      fileName: 'other.mp4',
      onChange: state.set,
      t,
      totalBytes: 200,
    })

    newerUpload.report({ loadedBytes: 50, totalBytes: 200 })
    abandonSaveUploadProgress({ setUploadProgress: state.set, upload: staleUpload })

    expect(state.get()).toEqual({ loadedBytes: 50, status: 'uploading', totalBytes: 200 })
  })

  it('should keep the result of a save that already settled', () => {
    const state = createProgressState()
    const upload = trackSaveUploadProgress({
      fileName: 'video.mp4',
      onChange: state.set,
      t,
      totalBytes: 100,
    })

    upload.settle({ isSuccessful: true })
    abandonSaveUploadProgress({ setUploadProgress: state.set, upload })

    expect(state.get()).toEqual({ loadedBytes: 100, status: 'success', totalBytes: 100 })
  })
})
