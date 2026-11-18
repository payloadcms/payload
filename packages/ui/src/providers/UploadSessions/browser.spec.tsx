import { toast } from 'sonner'
import { afterEach, describe, expect, test } from 'vitest'

import { createProgressToast } from './browser.js'

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
