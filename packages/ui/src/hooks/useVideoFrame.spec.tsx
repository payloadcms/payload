import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { createSilentWav } from '../utilities/silentWav.spec.fixture.js'
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
