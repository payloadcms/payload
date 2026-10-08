import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const testDirectories = []
const scriptPath = fileURLToPath(new URL('./convert-demo.sh', import.meta.url))

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

test('convert-demo creates a GitHub-compatible H.264 MP4', async () => {
  const directory = await createFakeMediaTools()
  const input = path.join(directory, 'demo.webm')
  const output = path.join(directory, 'demo.mp4')
  await writeFile(input, 'recording')

  const result = spawnSync(
    'bash',
    [scriptPath, input, output, '--trim-start', '1.25', '--crf', '24'],
    {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, new RegExp(`${escapeRegExp(output)}$`, 'm'))
  assert.equal(await readFile(output, 'utf8'), 'recording')

  const ffmpegArgs = await readFile(path.join(directory, 'ffmpeg-args.txt'), 'utf8')
  assert.match(ffmpegArgs, /-ss 1\.25/)
  assert.match(ffmpegArgs, /-c:v libx264/)
  assert.match(ffmpegArgs, /-crf 24/)
  assert.match(ffmpegArgs, /-pix_fmt yuv420p/)
  assert.match(ffmpegArgs, /-movflags \+faststart/)
})

test('convert-demo rejects output that exceeds the requested upload budget', async () => {
  const directory = await createFakeMediaTools({ outputBytes: 2048 })
  const input = path.join(directory, 'demo.webm')
  const output = path.join(directory, 'demo.mp4')
  await writeFile(input, 'recording')

  const result = spawnSync('bash', [scriptPath, input, output, '--max-kb', '1'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /exceeds the 1 KB upload budget/)
})

test('convert-demo rejects a missing recording', () => {
  const result = spawnSync('bash', [scriptPath, '/tmp/recording-does-not-exist.webm'], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /Input recording does not exist/)
})

async function createFakeMediaTools({ outputBytes } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'record-pr-demo-test-'))
  testDirectories.push(directory)

  const ffmpegPath = path.join(directory, 'ffmpeg')
  const ffprobePath = path.join(directory, 'ffprobe')
  const outputCommand = outputBytes
    ? `dd if=/dev/zero of="\${output}" bs=1 count=${outputBytes} 2>/dev/null`
    : 'cp "$input" "$output"'

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
${outputCommand}
`,
  )
  await writeFile(ffprobePath, '#!/usr/bin/env bash\necho h264\n')
  await chmod(ffmpegPath, 0o755)
  await chmod(ffprobePath, 0o755)

  return directory
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
