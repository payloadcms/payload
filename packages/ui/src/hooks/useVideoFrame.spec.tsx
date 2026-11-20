import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { useVideoFrame } from './useVideoFrame.js'

describe('useVideoFrame', () => {
  test('should show the fallback when the video does not load before the timeout', async () => {
    const screen = await render(<VideoFrameFixture shouldMountVideo={false} timeoutMs={50} />)

    await expect.element(screen.getByRole('status')).toHaveTextContent('loading')
    await expect.element(screen.getByRole('status')).toHaveTextContent('fallback')
  })

  test('should show the fallback and remove the video when it fails to load', async () => {
    const screen = await render(<VideoFrameFixture shouldMountVideo timeoutMs={60_000} />)

    await expect.element(screen.getByRole('status')).toHaveTextContent('fallback')
    expect(document.querySelector('video')).toBeNull()
  })

  test('should show the fallback when the file has no video track', async () => {
    const src = URL.createObjectURL(createSilentWav())
    const screen = await render(<VideoFrameFixture shouldMountVideo src={src} timeoutMs={60_000} />)

    await expect.element(screen.getByRole('status')).toHaveTextContent('fallback')
    expect(document.querySelector('video')).toBeNull()
    URL.revokeObjectURL(src)
  })

  test('should add the frame time to the video src', async () => {
    await render(<VideoFrameFixture shouldMountVideo timeoutMs={60_000} />)

    expect(document.querySelector('video')?.getAttribute('src')).toBe('/missing-video.mp4#t=0.1')
  })
})

function VideoFrameFixture({
  shouldMountVideo,
  src = '/missing-video.mp4',
  timeoutMs,
}: {
  shouldMountVideo: boolean
  src?: string
  timeoutMs: number
}) {
  const { isLoading, shouldRenderVideo, shouldShowFallback, videoProps } = useVideoFrame({
    src,
    timeoutMs,
  })

  return (
    <>
      <output role="status">
        {isLoading && 'loading'}
        {shouldShowFallback && 'fallback'}
      </output>
      {shouldMountVideo && shouldRenderVideo && <video {...videoProps} muted />}
    </>
  )
}

/** A playable, audio-only file: one second of 8 kHz, 8-bit mono silence. */
function createSilentWav(): Blob {
  const sampleRate = 8000
  const headerSize = 44
  const view = new DataView(new ArrayBuffer(headerSize + sampleRate))
  const writeText = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))

  writeText(0, 'RIFF')
  view.setUint32(4, headerSize - 8 + sampleRate, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  writeText(36, 'data')
  view.setUint32(40, sampleRate, true)
  // 8-bit PCM is unsigned, so 128 is silence
  for (let offset = headerSize; offset < view.byteLength; offset++) {
    view.setUint8(offset, 128)
  }

  return new Blob([view.buffer], { type: 'audio/wav' })
}
