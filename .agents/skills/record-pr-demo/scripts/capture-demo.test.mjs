import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { chromium } from '@playwright/test'
import { startLosslessCapture } from './capture-demo.mjs'

function ffmpeg({ args, input }) {
  const result = spawnSync('ffmpeg', ['-v', 'error', ...args], {
    input,
    maxBuffer: 8 * 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr?.toString())
  return result.stdout
}

test('should preserve exact screenshot pixels, native size, updates, and wall-clock duration', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-lossless-'))
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await page.setContent(
      '<style>body{margin:0;background:#fff;color:#222;font:16px sans-serif}button{margin:40px}</style><button onclick="document.body.style.background=\'#123456\'">Save document</button>Small, sharp text and a 1px border.',
    )
    const reference = await page.screenshot()
    const output = path.join(directory, 'capture.mkv')
    const capture = await startLosslessCapture({ page, output, size: { width: 800, height: 600 } })
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Save document' }).click()
    await page.waitForTimeout(300)
    const elapsed = (performance.now() - capture.startedAt) / 1000
    const stopping = capture.stop()
    assert.equal(capture.stop(), stopping)
    const result = await stopping
    assert.ok(
      Math.abs(result.duration - elapsed) < 0.15,
      `${result.duration}s video vs ${elapsed}s elapsed`,
    )
    const probe = spawnSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=codec_name,width,height',
        '-of',
        'json',
        output,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(probe.status, 0, probe.stderr)
    assert.deepEqual(JSON.parse(probe.stdout).streams[0], {
      codec_name: 'ffv1',
      width: 800,
      height: 600,
    })
    const first = ffmpeg({
      args: ['-i', output, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'],
    })
    const expected = ffmpeg({
      args: ['-i', 'pipe:0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'],
      input: reference,
    })
    assert.ok(first.equals(expected), 'Lossless capture changed the opening screenshot pixels')
    const last = ffmpeg({
      args: [
        '-sseof',
        '-0.08',
        '-i',
        output,
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgba',
        'pipe:1',
      ],
    })
    assert.deepEqual([...last.subarray(0, 4)], [0x12, 0x34, 0x56, 255])
  } finally {
    await browser.close()
    await rm(directory, { recursive: true, force: true })
  }
})

test('should stop the encoder and remove partial output after the page closes', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-lossless-close-'))
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    const output = path.join(directory, 'capture.mkv')
    const capture = await startLosslessCapture({ page, output, size: { width: 800, height: 600 } })
    await page.waitForTimeout(100)
    await page.close()
    await assert.rejects(capture.stop(), /closed|detached/i)
    await assert.rejects(stat(output), { code: 'ENOENT' })
  } finally {
    await browser.close()
    await rm(directory, { recursive: true, force: true })
  }
})

test('should remove a failed scenario recording and restore signal listeners', async () => {
  const { recordDemo } = await import('./record-demo.mjs')
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-lossless-error-'))
  const output = path.join(directory, 'capture.mkv')
  const scenario = path.join(directory, 'scenario.mjs')
  const signals = ['SIGINT', 'SIGTERM'].map((name) => process.listenerCount(name))
  try {
    await writeFile(
      scenario,
      `export const presentation={change:{kind:'Fix',title:'Capture',description:'Failure cleanup'}};
      export default async function({page,ready}){await page.goto('data:text/html,<button>Save</button>');await ready();throw new Error('Deliberate scenario failure')}`,
    )
    await assert.rejects(
      recordDemo({
        baseURL: 'http://capture.test',
        label: 'cleanup',
        output,
        scenario,
        viewport: { width: 800, height: 600 },
      }),
      /Deliberate scenario failure/,
    )
    await assert.rejects(stat(output), { code: 'ENOENT' })
    assert.deepEqual(
      ['SIGINT', 'SIGTERM'].map((name) => process.listenerCount(name)),
      signals,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('should clean up capture when interrupted with SIGINT', { timeout: 20000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-lossless-interrupt-'))
  const output = path.join(directory, 'capture.mkv')
  const scenario = path.join(directory, 'scenario.mjs')
  let child
  try {
    await writeFile(
      scenario,
      `export const presentation={change:{kind:'Fix',title:'Capture',description:'Cancellation cleanup'}};
      export default async function({page,ready}){await page.goto('data:text/html,<button>Save</button>');await ready();console.log('CAPTURE_READY');await page.waitForTimeout(60000)}`,
    )
    child = spawn(
      process.execPath,
      [
        new URL('./record-demo.mjs', import.meta.url).pathname,
        '--scenario',
        scenario,
        '--output',
        output,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (data) => {
      stdout += data
      if (stdout.includes('CAPTURE_READY')) child.kill('SIGINT')
    })
    child.stderr.on('data', (data) => {
      stderr += data
    })
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => resolve({ code, signal }))
    })
    assert.ok(stdout.includes('CAPTURE_READY'), stderr)
    assert.equal(result.signal, null)
    assert.equal(result.code, 1, stderr)
    await assert.rejects(stat(output), { code: 'ENOENT' })
  } finally {
    child?.kill('SIGKILL')
    await rm(directory, { recursive: true, force: true })
  }
})

for (const stalledOperation of ['Page.stopScreencast', 'detach']) {
  test(
    `should finish encoder cleanup when ${stalledOperation} never settles`,
    { timeout: 10000 },
    async () => {
      const directory = await mkdtemp(path.join(tmpdir(), 'demo-lossless-stalled-'))
      const browser = await chromium.launch({ headless: true })
      try {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 } })
        const page = await context.newPage()
        const newCDPSession = context.newCDPSession.bind(context)
        context.newCDPSession = async (target) => {
          const session = await newCDPSession(target)
          if (stalledOperation === 'detach') {
            session.detach = () => new Promise(() => {})
          } else {
            const send = session.send.bind(session)
            session.send = (method, ...args) =>
              method === stalledOperation ? new Promise(() => {}) : send(method, ...args)
          }
          return session
        }
        const output = path.join(directory, 'capture.mkv')
        const capture = await startLosslessCapture({
          page,
          output,
          size: { width: 800, height: 600 },
          shutdownTimeoutMs: 250,
        })
        await page.waitForTimeout(100)
        await assert.rejects(capture.stop(), /(?:Page.stopScreencast|CDP session detach) timed out/)
        await assert.rejects(stat(output), { code: 'ENOENT' })
      } finally {
        await browser.close()
        await rm(directory, { recursive: true, force: true })
      }
    },
  )
}
