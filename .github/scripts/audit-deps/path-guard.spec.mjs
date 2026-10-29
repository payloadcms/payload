import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { findDisallowedChanges, listWorkingTreeChanges } from './path-guard.mjs'

const modified = (path) => ({ isSymlink: false, path, status: ' M' })

describe('findDisallowedChanges', () => {
  it('allows nested package.json', () => {
    expect(
      findDisallowedChanges({
        changes: [modified('package.json'), modified('packages/ui/package.json')],
      }),
    ).toEqual([])
  })

  it('allows root pnpm-lock.yaml and pnpm-workspace.yaml', () => {
    expect(
      findDisallowedChanges({
        changes: [modified('pnpm-lock.yaml'), modified('pnpm-workspace.yaml')],
      }),
    ).toEqual([])
  })

  it('allows untracked and added allowed files', () => {
    expect(
      findDisallowedChanges({
        changes: [
          { isSymlink: false, path: 'packages/new/package.json', status: '??' },
          { isSymlink: false, path: 'packages/other/package.json', status: 'A' },
        ],
      }),
    ).toEqual([])
  })

  it('rejects .github/pnpm-lock.yaml and nested pnpm-workspace.yaml', () => {
    expect(
      findDisallowedChanges({
        changes: [modified('.github/pnpm-lock.yaml'), modified('tools/pnpm-workspace.yaml')],
      }),
    ).toEqual([
      '.github/pnpm-lock.yaml: path not allowed',
      'tools/pnpm-workspace.yaml: path not allowed',
    ])
  })

  it('rejects source files', () => {
    expect(findDisallowedChanges({ changes: [modified('src/index.ts')] })).toEqual([
      'src/index.ts: path not allowed',
    ])
  })

  it('rejects symlinked allowed paths', () => {
    expect(
      findDisallowedChanges({
        changes: [{ isSymlink: true, path: 'packages/ui/package.json', status: 'M' }],
      }),
    ).toEqual(['packages/ui/package.json: symlink'])
  })

  it('rejects deletions', () => {
    expect(
      findDisallowedChanges({
        changes: [
          { isSymlink: false, path: 'packages/ui/package.json', status: 'D' },
          { isSymlink: false, path: 'pnpm-lock.yaml', status: ' D' },
        ],
      }),
    ).toEqual(['packages/ui/package.json: deleted', 'pnpm-lock.yaml: deleted'])
  })

  it('rejects type changes and unmerged entries', () => {
    expect(
      findDisallowedChanges({
        changes: [
          { isSymlink: false, path: 'a/package.json', status: 'T' },
          { isSymlink: false, path: 'b/package.json', status: 'UU' },
        ],
      }),
    ).toEqual(['a/package.json: status T not allowed', 'b/package.json: status UU not allowed'])
  })

  it('rejects rename from a disallowed path', () => {
    expect(
      findDisallowedChanges({
        changes: [
          { isSymlink: false, path: 'packages/ui/package.json', status: 'A ' },
          { isSymlink: false, path: 'src/old.ts', status: 'D' },
        ],
      }),
    ).toEqual(['src/old.ts: path not allowed', 'src/old.ts: deleted'])
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

  it('listWorkingTreeChanges reads a real temp git repo', async () => {
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
    const byPath = Object.fromEntries(changes.map((change) => [change.path, change]))

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

  it('reports both paths of a staged rename', async () => {
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
