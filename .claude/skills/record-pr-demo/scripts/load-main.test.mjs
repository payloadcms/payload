import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { loadSkill } from './load-main.mjs'

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

test('should refresh main, reuse unchanged snapshots, resolve project dependencies, and fail when remote is unavailable', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'shared-pr-demo-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = path.join(root, 'source')
  const project = path.join(root, 'project')
  const skillPath = '.agents/skills/record-pr-demo'
  await mkdir(path.join(source, skillPath, 'scripts'), { recursive: true })
  await mkdir(path.join(project, 'node_modules', 'demo-dependency'), { recursive: true })
  await writeFile(
    path.join(project, 'node_modules/demo-dependency/package.json'),
    JSON.stringify({ type: 'module', exports: './index.mjs' }),
  )
  await writeFile(
    path.join(project, 'node_modules/demo-dependency/index.mjs'),
    'export default "dependency works"',
  )
  await writeFile(
    path.join(source, skillPath, 'scripts/prepare-demo.mjs'),
    'import value from "demo-dependency"; console.log(value)',
  )
  await writeFile(path.join(source, skillPath, 'SKILL.md'), 'version A')
  git(source, 'init', '-b', 'main')
  git(source, 'add', '.')
  git(source, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'A')
  const options = { repository: source, projectRoot: project }
  const first = await loadSkill(options)
  assert.equal(await readFile(first.skillFile, 'utf8'), 'version A')
  assert.equal(
    execFileSync(process.execPath, [first.entrypoint], { cwd: project, encoding: 'utf8' }).trim(),
    'dependency works',
  )
  assert.equal((await loadSkill(options)).skillFile, first.skillFile)
  await writeFile(path.join(source, skillPath, 'SKILL.md'), 'version B')
  git(source, 'add', '.')
  git(source, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'B')
  const second = await loadSkill(options)
  assert.notEqual(second.revision, first.revision)
  assert.equal(await readFile(second.skillFile, 'utf8'), 'version B')
  assert.equal(await readFile(first.skillFile, 'utf8'), 'version A')
  await writeFile(path.join(source, skillPath, 'SKILL.md'), 'version C')
  git(source, 'add', '.')
  git(source, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'C')
  const concurrent = await Promise.all([loadSkill(options), loadSkill(options)])
  assert.equal(concurrent[0].revision, concurrent[1].revision)
  assert.equal(await readFile(concurrent[0].skillFile, 'utf8'), 'version C')
  await rm(path.join(source, skillPath, 'scripts/prepare-demo.mjs'))
  git(source, 'add', '.')
  git(
    source,
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '-m',
    'incomplete skill',
  )
  await assert.rejects(loadSkill(options), /ENOENT/)
  assert.equal(await readFile(second.skillFile, 'utf8'), 'version B')
  await rm(source, { recursive: true })
  await assert.rejects(loadSkill(options), /refresh|remote|repository/i)
})
