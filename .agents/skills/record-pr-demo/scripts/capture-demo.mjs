import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { rm } from 'node:fs/promises'

/**
 * Streams PNG frames into lossless FFV1, keeping only the latest frame in memory.
 * Repeats that frame at 25 fps during idle periods and encoder backpressure so
 * presentation timing follows wall time. The final converter performs the only
 * lossy encode. No PNG files are written to disk.
 */
export async function startLosslessCapture({
  page,
  output,
  size,
  fps = 25,
  shutdownTimeoutMs = 10000,
}) {
  const session = await page.context().newCDPSession(page)
  const encoder = spawn(
    'ffmpeg',
    [
      '-v',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'png',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      'ffv1',
      '-threads',
      '2',
      '-f',
      'matroska',
      output,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )
  let stderr = ''
  let failure
  let latestFrame
  let writtenFrames = 0
  let timer
  let startedAt
  let stoppedAt
  let stopPromise
  let writing = Promise.resolve()
  encoder.stderr.on('data', (data) => {
    stderr = (stderr + data).slice(-8000)
  })
  encoder.stdin.on('error', (error) => {
    failure ??= error
  })
  const completion = new Promise((resolve, reject) => {
    encoder.once('error', reject)
    encoder.once('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`Lossless capture failed (${code}): ${stderr}`)),
    )
  })
  void completion.catch((error) => {
    failure ??= error
  })
  const frameReceived = (event) => {
    latestFrame = Buffer.from(event.data, 'base64')
    void session.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch((error) => {
      failure ??= error
    })
  }
  const writeThrough = async (target) => {
    if (failure) throw failure
    while (writtenFrames < target) {
      if (failure) throw failure
      if (!encoder.stdin.write(latestFrame)) await once(encoder.stdin, 'drain')
      writtenFrames++
    }
  }
  const frameCount = (now) => Math.max(1, Math.ceil(((now - startedAt) * fps) / 1000))
  const pump = () => {
    writing = writeThrough(frameCount(performance.now()))
    void writing
      .then(() => {
        if (stoppedAt === undefined) timer = setTimeout(pump, 10)
      })
      .catch((error) => {
        failure ??= error
      })
  }
  // Bound shutdown even if the encoder or its input pipe stops responding.
  const finishEncoder = async () => {
    const timeout = setTimeout(() => {
      encoder.stdin.destroy(new Error('Lossless encoder shutdown timed out'))
      encoder.kill('SIGKILL')
    }, shutdownTimeoutMs)
    timeout.unref()
    try {
      encoder.stdin.end()
      await completion
    } finally {
      clearTimeout(timeout)
    }
  }
  const boundShutdown = async ({ operation, run }) => {
    let timeout
    try {
      await Promise.race([
        Promise.resolve().then(run),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error(`${operation} timed out`)), shutdownTimeoutMs)
        }),
      ])
    } finally {
      clearTimeout(timeout)
    }
  }
  const stop = () => {
    stopPromise ??= (async () => {
      stoppedAt = performance.now()
      clearTimeout(timer)
      let timeout
      try {
        await boundShutdown({
          operation: 'Page.stopScreencast',
          run: () => session.send('Page.stopScreencast'),
        })
        timeout = setTimeout(() => {
          encoder.stdin.destroy(new Error('Lossless capture flush timed out'))
          encoder.kill('SIGKILL')
        }, shutdownTimeoutMs)
        timeout.unref()
        await writing
        await writeThrough(frameCount(stoppedAt))
      } catch (error) {
        failure ??= error
      } finally {
        clearTimeout(timeout)
        session.off('Page.screencastFrame', frameReceived)
        await boundShutdown({ operation: 'CDP session detach', run: () => session.detach() }).catch(
          (error) => {
            failure ??= error
          },
        )
        await finishEncoder().catch((error) => {
          failure ??= error
        })
      }
      if (failure) {
        await rm(output, { force: true })
        throw failure
      }
      return { frames: writtenFrames, duration: writtenFrames / fps }
    })()
    return stopPromise
  }
  try {
    await once(encoder, 'spawn')
    await session.send('Page.enable')
    latestFrame = Buffer.from(
      (await session.send('Page.captureScreenshot', { format: 'png' })).data,
      'base64',
    )
    startedAt = performance.now()
    session.on('Page.screencastFrame', frameReceived)
    await session.send('Page.startScreencast', {
      format: 'png',
      maxWidth: size.width,
      maxHeight: size.height,
      everyNthFrame: 1,
    })
    pump()
    return { startedAt, stop }
  } catch (error) {
    failure ??= error
    await stop().catch(() => {})
    throw error
  }
}
