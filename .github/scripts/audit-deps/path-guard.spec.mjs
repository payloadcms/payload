import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { findDisallowedChanges, listWorkingTreeChanges } from './path-guard.mjs'

const change = ({ path, status = ' M', isSymlink = false }) => ({ isSymlink, path, status })

describe('findDisallowedChanges', () => {
  it('should allow package.json anywhere and the root pnpm files when modified or added', () => {
    expect(
      findDisallowedChanges({
        changes: [
          change({ path: 'package.json' }),
          change({ path: 'packages/ui/package.json' }),
          change({ path: 'pnpm-lock.yaml' }),
          change({ path: 'pnpm-workspace.yaml' }),
          change({ path: 'packages/new/package.json', status: '??' }),
          change({ path: 'packages/other/package.json', status: 'A' }),
        ],
      }),
    ).toEqual([])
  })

  it('should reject paths outside the allowlist', () => {
    const paths = [
      '.github/pnpm-lock.yaml',
      'tools/pnpm-workspace.yaml',
      'src/index.ts',
      '../package.json',
      'a//package.json',
      '.git/package.json',
      'x/.GIT/package.json',
    ]

    expect(findDisallowedChanges({ changes: paths.map((path) => change({ path })) })).toEqual(
      paths.map((path) => `${path}: path not allowed`),
    )
  })

  it('should reject symlinked allowed paths', () => {
    expect(
      findDisallowedChanges({
        changes: [change({ path: 'packages/ui/package.json', isSymlink: true })],
      }),
    ).toEqual(['packages/ui/package.json: symlink'])
  })

  it('should reject deletions, type changes, unmerged and ignored entries', () => {
    expect(
      findDisallowedChanges({
        changes: [
          change({ path: 'packages/ui/package.json', status: 'D' }),
          change({ path: 'pnpm-lock.yaml', status: ' D' }),
          change({ path: 'a/package.json', status: 'T' }),
          change({ path: 'b/package.json', status: 'UU' }),
          change({ path: 'ignored/package.json', status: '!!' }),
        ],
      }),
    ).toEqual([
      'packages/ui/package.json: deleted',
      'pnpm-lock.yaml: deleted',
      'a/package.json: status T not allowed',
      'b/package.json: status UU not allowed',
      'ignored/package.json: ignored path changed',
    ])
  })
})

describe('listWorkingTreeChanges', () => {
  const dirs = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true })
    }
  })

  const git = (cwd, ...args) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=t',
        '-c',
        'user.email=t@example.com',
        '-c',
        'commit.gpgsign=false',
        '-c',
        'core.autocrlf=false',
        ...args,
      ],
      { cwd, stdio: 'pipe' },
    )

  const makeRepo = () => {
    const dir = mkdtempSync(join(tmpdir(), 'path-guard-'))
    dirs.push(dir)
    git(dir, 'init', '-q')
    return dir
  }

  it('should report changes under ignored paths', async () => {
    const dir = makeRepo()
    writeFileSync(join(dir, '.gitignore'), '.audit-deps/\n')
    git(dir, 'add', '.gitignore')
    git(dir, 'commit', '-q', '-m', 'init')
    mkdirSync(join(dir, '.audit-deps', 'tooling'), { recursive: true })
    writeFileSync(join(dir, '.audit-deps', 'tooling', 'cli.mjs'), 'evil\n')

    const changes = await listWorkingTreeChanges({ cwd: dir })

    expect(changes).toEqual([{ isSymlink: false, path: '.audit-deps/', status: '!!' }])
    expect(findDisallowedChanges({ changes })).toEqual([
      '.audit-deps/: path not allowed',
      '.audit-deps/: ignored path changed',
    ])
  })

  it('should read statuses, symlinks and raw paths from a real git repo', async () => {
    const dir = makeRepo()
    writeFileSync(join(dir, 'package.json'), '{}\n')
    writeFileSync(join(dir, 'gone.txt'), 'x\n')
    git(dir, 'add', '.')
    git(dir, 'commit', '-q', '-m', 'init')

    writeFileSync(join(dir, 'package.json'), '{"a":1}\n')
    git(dir, 'rm', '-q', 'gone.txt')
    mkdirSync(join(dir, 'pkg'))
    writeFileSync(join(dir, 'target.txt'), 'x\n')
    symlinkSync('../target.txt', join(dir, 'pkg', 'package.json'))
    writeFileSync(join(dir, 'ünï cödé "q".ts'), 'x\n')

    const changes = await listWorkingTreeChanges({ cwd: dir })
    const byPath = Object.fromEntries(changes.map((entry) => [entry.path, entry]))

    expect(byPath['package.json']).toEqual({ isSymlink: false, path: 'package.json', status: ' M' })
    expect(byPath['gone.txt']).toEqual({ isSymlink: false, path: 'gone.txt', status: 'D ' })
    expect(byPath['pkg/package.json']).toEqual({
      isSymlink: true,
      path: 'pkg/package.json',
      status: '??',
    })
    expect(byPath['ünï cödé "q".ts']?.status).toBe('??')
    expect(findDisallowedChanges({ changes })).toContain('pkg/package.json: symlink')
  })

  it('should report both paths of a staged rename', async () => {
    const dir = makeRepo()
    writeFileSync(join(dir, 'old.ts'), 'some content that is long enough to match\n'.repeat(5))
    git(dir, 'add', '.')
    git(dir, 'commit', '-q', '-m', 'init')
    git(dir, 'mv', 'old.ts', 'package.json')

    const changes = await listWorkingTreeChanges({ cwd: dir })

    expect(changes).toEqual([
      { isSymlink: false, path: 'package.json', status: 'A ' },
      { isSymlink: false, path: 'old.ts', status: 'D' },
    ])
    expect(findDisallowedChanges({ changes })).toEqual([
      'old.ts: path not allowed',
      'old.ts: deleted',
    ])
  })
})
