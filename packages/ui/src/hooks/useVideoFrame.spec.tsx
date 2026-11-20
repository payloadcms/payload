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

  test('should add the frame time to the video src', async () => {
    await render(<VideoFrameFixture shouldMountVideo timeoutMs={60_000} />)

    expect(document.querySelector('video')?.getAttribute('src')).toBe('/missing-video.mp4#t=0.1')
  })
})

function VideoFrameFixture({
  shouldMountVideo,
  timeoutMs,
}: {
  shouldMountVideo: boolean
  timeoutMs: number
}) {
  const { isLoading, shouldRenderVideo, shouldShowFallback, videoProps } = useVideoFrame({
    src: '/missing-video.mp4',
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
