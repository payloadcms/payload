import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import {
  superviseRecordingJob,
  startRecordingJob,
  recordingJobStatus,
  renewRecordingJob,
  stopRecordingJob,
} from './recording-job.mjs'

async function fixture({ run, leaseMs = 150, command }) {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-job-test-'))
  await mkdir(path.join(directory, 'artifacts'))
  const output = path.join(directory, 'artifacts', 'demo.mp4')
  await writeFile(output, 'partial video')
  await writeFile(
    path.join(directory, 'state.json'),
    JSON.stringify({
      status: 'starting',
      createdAt: Date.now(),
      output,
      log: path.join(directory, 'job.log'),
    }),
  )
  await writeFile(
    path.join(directory, 'lease.json'),
    JSON.stringify({ expiresAt: Date.now() + leaseMs }),
  )
  try {
    await run({
      directory,
      output,
      start: ({ code, maxDurationMs = 5000, graceMs = 100 }) =>
        superviseRecordingJob({
          directory,
          command: command ?? process.execPath,
          args: ['-e', code],
          maxDurationMs,
          pollMs: 20,
          graceMs,
        }),
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('should stop on lease expiry and remove partial conversion output', async () => {
  await fixture({
    run: async ({ start, output }) => {
      const state = await start({
        code: 'process.on("SIGINT",()=>process.exit(0));setInterval(()=>{},1000)',
      })
      assert.equal(state.status, 'cancelled')
      assert.equal(state.reason, 'lease-expired')
      await assert.rejects(stat(output), { code: 'ENOENT' })
    },
  })
})

test('should preserve successful artifacts while the caller renews the lease', async () => {
  await fixture({
    leaseMs: 1000,
    run: async ({ directory, start, output }) => {
      const renew = setInterval(
        () =>
          void (async () => {
            const temporary = path.join(directory, 'lease-next.json')
            await writeFile(temporary, JSON.stringify({ expiresAt: Date.now() + 1000 }))
            await rename(temporary, path.join(directory, 'lease.json'))
          })(),
        50,
      )
      try {
        const state = await start({ code: 'setTimeout(()=>process.exit(0),350)' })
        assert.equal(state.status, 'completed')
        assert.ok((await stat(output)).size > 0)
      } finally {
        clearInterval(renew)
      }
    },
  })
})

test('should honor stop requests and escalate when the recorder ignores SIGINT', async () => {
  await fixture({
    leaseMs: 5000,
    run: async ({ directory, start, output }) => {
      const running = start({ code: 'process.on("SIGINT",()=>{});setInterval(()=>{},1000)' })
      await wait(150)
      await writeFile(path.join(directory, 'stop'), '')
      const state = await running
      assert.equal(state.status, 'cancelled')
      assert.equal(state.reason, 'stopped')
      await assert.rejects(stat(output), { code: 'ENOENT' })
    },
  })
})

test('should enforce a duration limit even with a valid lease', async () => {
  await fixture({
    leaseMs: 5000,
    run: async ({ start }) => {
      const state = await start({ code: 'setInterval(()=>{},1000)', maxDurationMs: 150 })
      assert.equal(state.reason, 'duration-limit')
    },
  })
})

test('should clean partial artifacts after recorder failure', async () => {
  await fixture({
    leaseMs: 5000,
    run: async ({ start, output }) => {
      const state = await start({ code: 'process.exit(2)' })
      assert.equal(state.status, 'failed')
      assert.equal(state.exitCode, 2)
      await assert.rejects(stat(output), { code: 'ENOENT' })
    },
  })
})

test('should handle failure to start the recorder without leaving artifacts', async () => {
  await fixture({
    command: '/nonexistent/payload-recorder',
    run: async ({ start, output }) => {
      const state = await start({ code: '' })
      assert.equal(state.status, 'failed')
      await assert.rejects(stat(output), { code: 'ENOENT' })
    },
  })
})

test('should reject unsafe IDs, unmanaged output paths, and invalid durations', async () => {
  await assert.rejects(recordingJobStatus({ id: '../../other' }), /Invalid/)
  await assert.rejects(
    startRecordingJob({ args: ['--scenario', '/tmp/demo.mjs', '--output', '/tmp/user.mp4'] }),
    /own artifact/,
  )
  await assert.rejects(
    startRecordingJob({ args: ['--scenario', '/tmp/demo.mjs'], leaseMs: 0 }),
    /positive/,
  )
})

test(
  'should also stop descendants that create a separate process group',
  { timeout: 5000 },
  async () => {
    await fixture({
      leaseMs: 5000,
      run: async ({ directory, start }) => {
        const pidFile = path.join(directory, 'grandchild.pid')
        const grandchild = 'process.on("SIGINT",()=>{});setInterval(()=>{},1000)'
        const code = `const {spawn}=require('node:child_process');const fs=require('node:fs');const child=spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{detached:true,stdio:'ignore'});fs.writeFileSync(${JSON.stringify(pidFile)},String(child.pid));process.on('SIGINT',()=>{});setInterval(()=>{},1000)`
        const running = start({ code })
        let pid
        for (let i = 0; i < 50; i++) {
          try {
            pid = Number(await readFile(pidFile, 'utf8'))
            break
          } catch {
            await wait(20)
          }
        }
        assert.ok(pid)
        await writeFile(path.join(directory, 'stop'), '')
        await running
        for (let i = 0; i < 50; i++) {
          try {
            process.kill(pid, 0)
          } catch (error) {
            assert.equal(error.code, 'ESRCH')
            return
          }
          await wait(20)
        }
        assert.fail('Detached recording descendant is still running')
      },
    })
  },
)

test(
  'should start, find, inspect, renew, and stop a real recording job',
  { timeout: 30000 },
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'demo-job-api-'))
    const server = createServer((request, response) => response.end('Demo fixture'))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    let job
    const finish = async () => {
      for (let i = 0; i < 300; i++) {
        const state = await recordingJobStatus({ id: job.id })
        if (['completed', 'cancelled', 'failed'].includes(state.status)) return state
        await wait(50)
      }
      throw new Error('Recording job did not finish')
    }
    try {
      const scenario = path.join(directory, 'scenario.mjs')
      await writeFile(
        scenario,
        `export const presentation={change:{kind:'Fix',title:'Recording lease',description:'Stop a real recording safely.'}};export default async function({page,ready,pause}){await page.goto('data:text/html,<button>Save document</button>');await ready();console.log('JOB_CAPTURE_READY');await pause(30000)}`,
      )
      job = await startRecordingJob({
        args: ['--scenario', scenario, '--base-url', `http://127.0.0.1:${server.address().port}`],
      })
      const before = await recordingJobStatus({ id: job.id })
      const after = await recordingJobStatus({ id: job.id })
      assert.equal(after.leaseExpiresAt, before.leaseExpiresAt, 'Reading status renewed the lease')
      assert.ok((await recordingJobStatus()).jobs.some((candidate) => candidate.id === job.id))
      const renewed = await renewRecordingJob({ id: job.id })
      assert.ok(renewed.leaseExpiresAt >= before.leaseExpiresAt)
      for (let i = 0; i < 200; i++) {
        const log = await readFile(job.log, 'utf8').catch(() => '')
        if ((log.match(/JOB_CAPTURE_READY/g) ?? []).length >= 2) break
        await wait(50)
      }
      assert.ok(
        ((await readFile(job.log, 'utf8')).match(/JOB_CAPTURE_READY/g) ?? []).length >= 2,
        'Recording never reached the active capture phase',
      )
      const stopped = await stopRecordingJob({ id: job.id })
      assert.equal(stopped.stopRequested, true)
      const state = await finish()
      assert.equal(state.status, 'cancelled')
      assert.equal(state.reason, 'stopped')
      await assert.rejects(stat(job.output), { code: 'ENOENT' })
      await assert.rejects(renewRecordingJob({ id: job.id }), /Cannot renew cancelled/)
      await rm(path.dirname(job.log), { recursive: true, force: true })
      job = await startRecordingJob({
        args: ['--scenario', scenario, '--base-url', `http://127.0.0.1:${server.address().port}`],
        leaseMs: 3000,
      })
      const expired = await finish()
      assert.equal(expired.status, 'cancelled')
      assert.equal(expired.reason, 'lease-expired')
      await assert.rejects(stat(job.output), { code: 'ENOENT' })
    } finally {
      if (job) {
        await stopRecordingJob({ id: job.id })
        await finish()
        await rm(path.dirname(job.log), { recursive: true, force: true })
      }
      await new Promise((resolve) => server.close(resolve))
      await rm(directory, { recursive: true, force: true })
    }
  },
)
