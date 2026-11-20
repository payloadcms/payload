import { describe, expect, test } from 'vitest'

import { createSilentWav } from '../../utilities/silentWav.spec.fixture.js'
import { createThumbnail } from './createThumbnail.js'

describe('createThumbnail', () => {
  test('should reject a video file with no video track', async () => {
    const file = new File([createSilentWav()], 'audio-only.mp4', { type: 'video/mp4' })

    await expect(createThumbnail(file)).rejects.toThrow('has no video frame')
  })
})
