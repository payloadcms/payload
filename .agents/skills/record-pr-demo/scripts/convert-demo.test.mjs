import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'

import { convertDemo } from './convert-demo.mjs'

const testDirectories = []

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

test('convertDemo uses the opening ready time for H.264 conversion', async () => {
  const directory = await createFakeFfmpeg()
  const input = path.join(directory, 'demo.webm')
  const output = path.join(directory, 'demo.mp4')
  await writeFile(input, 'recording')

  await convertDemo({
    environment: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    input,
    output,
    trimStart: 1.25,
  })

  assert.equal(await readFile(output, 'utf8'), 'recording')
  const ffmpegArgs = await readFile(path.join(directory, 'ffmpeg-args.txt'), 'utf8')
  assert.match(ffmpegArgs, /-ss 1\.25/)
  assert.match(ffmpegArgs, /-c:v libx264/)
  assert.match(ffmpegArgs, /-crf 18/)
  assert.match(ffmpegArgs, /-pix_fmt yuv420p/)
  assert.match(ffmpegArgs, /-movflags \+faststart/)
})

test('convertDemo rejects a missing opening ready time', async () => {
  await assert.rejects(
    convertDemo({ input: '/tmp/demo.webm', output: '/tmp/demo.mp4' }),
    /valid opening ready time/,
  )
})

async function createFakeFfmpeg() {
  const directory = await mkdtemp(path.join(tmpdir(), 'convert-pr-demo-test-'))
  testDirectories.push(directory)
  const ffmpegPath = path.join(directory, 'ffmpeg')

  await writeFile(
    ffmpegPath,
    `#!/usr/bin/env bash
printf '%s ' "$@" > "${directory}/ffmpeg-args.txt"
input=""
previous=""
for argument in "$@"; do
  if [ "$previous" = "-i" ]; then input="$argument"; fi
  previous="$argument"
  output="$argument"
done
cp "$input" "$output"
`,
  )
  await chmod(ffmpegPath, 0o755)

  return directory
}
