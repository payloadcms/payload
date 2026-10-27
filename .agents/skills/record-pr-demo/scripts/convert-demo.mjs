import { spawnSync } from 'node:child_process'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'

const MAX_VIDEO_BYTES = 10 * 1024 * 1024

export async function convertDemo({ environment = process.env, input, output, trimStart }) {
  if (!Number.isFinite(trimStart) || trimStart < 0) {
    throw new Error('Conversion requires a valid opening ready time')
  }

  await mkdir(path.dirname(output), { recursive: true })
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-ss',
      String(trimStart),
      '-i',
      input,
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      output,
    ],
    { encoding: 'utf8', env: environment, maxBuffer: MAX_VIDEO_BYTES },
  )

  if (result.error) {
    throw new Error(`ffmpeg failed to start: ${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${(result.stderr || result.stdout).trim()}`)
  }

  if ((await stat(output)).size > MAX_VIDEO_BYTES) {
    throw new Error('Converted video exceeds the 10240 KB upload budget. Shorten the demo.')
  }
}
