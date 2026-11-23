/** Record a short, silent WebM of a changing canvas, for tests that need a video that decodes and plays. */
export async function createTestVideo({ durationMs = 1000 }: { durationMs?: number } = {}) {
  const canvas = Object.assign(document.createElement('canvas'), { height: 48, width: 64 })
  const context = canvas.getContext('2d')
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm' })
  const chunks: Blob[] = []
  const hasStopped = new Promise((resolve) => recorder.addEventListener('stop', resolve))

  recorder.addEventListener('dataavailable', (event) => chunks.push(event.data))
  recorder.start()

  // A canvas stream only emits frames when the canvas changes
  for (let elapsedMs = 0; elapsedMs < durationMs; elapsedMs += 33) {
    if (context) {
      context.fillStyle = `hsl(${elapsedMs % 360} 80% 50%)`
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    await new Promise((resolve) => setTimeout(resolve, 33))
  }

  recorder.stop()
  await hasStopped

  return new Blob(chunks, { type: 'video/webm' })
}
