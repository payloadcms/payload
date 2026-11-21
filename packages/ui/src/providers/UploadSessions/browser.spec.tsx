import type { TFunction } from '@payloadcms/translations'

import { toast } from 'sonner'
import { afterEach, describe, expect, test } from 'vitest'

import { createProgressToast, getUploadProgressMessage } from './browser.js'

const toastID = 'upload-session-recovery-test'

const getToast = () => toast.getToasts().find(({ id }) => id === toastID)

describe('createProgressToast', () => {
  afterEach(() => {
    toast.dismiss(toastID)
  })

  test('should not keep the actions or description of the toast it replaces', () => {
    toast.warning('Upload of video.mp4 was interrupted.', {
      id: toastID,
      action: { label: 'Select a file', onClick: () => {} },
      cancel: { label: 'Cancel upload', onClick: () => {} },
      description: 'The selected file does not match the interrupted upload.',
      duration: Infinity,
    })

    createProgressToast({ id: toastID }).show('Resuming video.mp4')

    expect(getToast()).toMatchObject({ title: 'Resuming video.mp4', type: 'loading' })
    expect(getToast()).toMatchObject({
      action: undefined,
      cancel: undefined,
      description: undefined,
    })
  })
})

describe('getUploadProgressMessage', () => {
  const t = ((key: string, vars?: Record<string, unknown>) =>
    `${key} ${JSON.stringify(vars ?? {})}`) as unknown as TFunction

  test('should show only the file name when no progress is reported', () => {
    expect(getUploadProgressMessage({ fileName: 'a.mp4', t })).toBe(
      'upload:uploadingFile {"filename":"a.mp4"}',
    )
  })

  test('should show the whole percent sent', () => {
    expect(
      getUploadProgressMessage({
        fileName: 'a.mp4',
        progress: { loadedBytes: 999, totalBytes: 1000 },
        t,
      }),
    ).toBe('upload:uploadingFileProgress {"filename":"a.mp4","percent":99}')
  })

  test('should show processing for a fully sent or empty file', () => {
    for (const progress of [
      { loadedBytes: 10, totalBytes: 10 },
      { loadedBytes: 0, totalBytes: 0 },
    ]) {
      expect(getUploadProgressMessage({ fileName: 'a.mp4', progress, t })).toBe(
        'upload:processingAndSavingFile {"filename":"a.mp4"}',
      )
    }
  })
})
