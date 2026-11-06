#!/usr/bin/env node
import { execFile } from 'node:child_process'
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const REPOSITORY = 'https://github.com/payloadcms/payload.git'
const SKILL_PATH = '.agents/skills/record-pr-demo'

async function git(cwd, ...args) {
  const { stdout } = await execute('git', args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  return stdout.trim()
}

export async function loadSkill({ repository = REPOSITORY, projectRoot = process.cwd() } = {}) {
  projectRoot = await realpath(projectRoot)
  let revision
  try {
    const remote = await git(projectRoot, 'ls-remote', '--exit-code', repository, 'refs/heads/main')
    revision = remote.split(/\s+/)[0]
    if (!/^[a-f0-9]{40,64}$/.test(revision)) throw new Error('Invalid main revision')
  } catch (error) {
    throw new Error(
      `Could not refresh record-pr-demo from remote main; refusing to use stale instructions. ${error.message}`,
    )
  }

  const dependencies = path.join(projectRoot, 'node_modules')
  try {
    await access(dependencies)
  } catch {
    throw new Error(
      `Install dependencies in ${projectRoot} before loading record-pr-demo (pnpm install).`,
    )
  }
  const cache = path.join(dependencies, '.cache', 'payload-record-pr-demo')
  const snapshot = path.join(cache, revision)
  const result = {
    revision,
    skillDirectory: path.join(snapshot, 'skill'),
    skillFile: path.join(snapshot, 'skill', 'SKILL.md'),
    entrypoint: path.join(snapshot, 'skill', 'scripts', 'prepare-demo.mjs'),
  }
  try {
    await readFile(path.join(snapshot, '.complete'))
    await access(result.skillFile)
    await access(result.entrypoint)
    return result
  } catch {
    // Publish only complete snapshots; failed downloads never become cache hits.
  }
  await mkdir(cache, { recursive: true })
  const staging = await mkdtemp(path.join(cache, '.download-'))
  try {
    const checkout = path.join(staging, 'checkout')
    await mkdir(checkout)
    await git(checkout, 'init', '--quiet')
    await git(checkout, 'remote', 'add', 'origin', repository)
    await git(checkout, 'config', 'remote.origin.promisor', 'true')
    await git(checkout, 'config', 'remote.origin.partialclonefilter', 'blob:none')
    await git(checkout, 'sparse-checkout', 'init', '--cone')
    await git(checkout, 'sparse-checkout', 'set', SKILL_PATH)
    await git(
      checkout,
      'fetch',
      '--quiet',
      '--no-tags',
      '--depth=1',
      '--filter=blob:none',
      'origin',
      revision,
    )
    await git(checkout, 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
    await access(path.join(checkout, SKILL_PATH, 'SKILL.md'))
    await access(path.join(checkout, SKILL_PATH, 'scripts', 'prepare-demo.mjs'))
    await cp(path.join(checkout, SKILL_PATH), path.join(staging, 'skill'), { recursive: true })
    await rm(checkout, { recursive: true, force: true })
    // ESM imports resolve beside the fetched scripts, not from the shell's cwd.
    await symlink(
      dependencies,
      path.join(staging, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await writeFile(path.join(staging, '.complete'), `${revision}\n`)
    try {
      await rename(staging, snapshot)
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error
      await access(path.join(snapshot, '.complete'))
      await access(result.skillFile)
      await access(result.entrypoint)
    }
    return result
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

if (process.argv[1] && (await realpath(process.argv[1])) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await loadSkill(), null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
