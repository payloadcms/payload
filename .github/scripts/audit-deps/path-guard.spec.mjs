import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  findDisallowedChanges,
  findDisallowedPatchChanges,
  listPatchChanges,
  listWorkingTreeChanges,
} from './path-guard.mjs'

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

  it('rejects parent, empty, and .git segments', () => {
    expect(
      findDisallowedChanges({
        changes: [
          modified('../package.json'),
          modified('a//package.json'),
          modified('.git/package.json'),
          modified('x/.GIT/package.json'),
        ],
      }),
    ).toEqual([
      '../package.json: path not allowed',
      'a//package.json: path not allowed',
      '.git/package.json: path not allowed',
      'x/.GIT/package.json: path not allowed',
    ])
  })

  it('rejects ignored entries even at allowed paths', () => {
    expect(
      findDisallowedChanges({
        changes: [
          { isSymlink: false, path: 'ignored/package.json', status: '!!' },
          { isSymlink: false, path: '.audit-deps/', status: '!!' },
        ],
      }),
    ).toEqual([
      'ignored/package.json: ignored path changed',
      '.audit-deps/: path not allowed',
      '.audit-deps/: ignored path changed',
    ])
  })
})

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

describe('listWorkingTreeChanges', () => {
  it('reports changes under ignored paths', async () => {
    const dir = makeRepo()
    writeFileSync(join(dir, '.gitignore'), '.audit-deps/\n')
    git(dir, 'add', '.gitignore')
    git(dir, 'commit', '-q', '-m', 'init')
    mkdirSync(join(dir, '.audit-deps', 'tooling'), { recursive: true })
    writeFileSync(join(dir, '.audit-deps', 'tooling', 'cli.mjs'), 'evil\n')

    const changes = await listWorkingTreeChanges({ cwd: dir })

    expect(changes).toEqual([{ isSymlink: false, path: '.audit-deps/', status: '!!' }])
    expect(findDisallowedChanges({ changes })).toContain('.audit-deps/: ignored path changed')
  })

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

describe('listPatchChanges', () => {
  // Commits `files`, runs `edit`, saves `git diff HEAD` as the patch, then resets the repo.
  const makePatch = ({ edit, files }) => {
    const dir = makeRepo()
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(dir, path, '..'), { recursive: true })
      writeFileSync(join(dir, path), content)
    }
    git(dir, 'add', '-f', ...Object.keys(files))
    git(dir, 'commit', '-q', '-m', 'init')

    edit({ dir })
    git(dir, 'add', '-f', '-A')
    const patchDir = mkdtempSync(join(tmpdir(), 'path-guard-patch-'))
    dirs.push(patchDir)
    const patchPath = join(patchDir, 'fix.patch')
    writeFileSync(patchPath, git(dir, 'diff', 'HEAD', '--binary', '-M'))
    git(dir, 'reset', '-q', '--hard')
    git(dir, 'clean', '-qfdx')

    return { dir, patchPath }
  }

  it('rejects a hunk on ignored tooling', async () => {
    const { dir, patchPath } = makePatch({
      edit: ({ dir }) => writeFileSync(join(dir, '.audit-deps/tooling/cli.mjs'), 'evil\n'),
      files: { '.audit-deps/tooling/cli.mjs': 'trusted\n', '.gitignore': '.audit-deps/\n' },
    })

    const result = await listPatchChanges({ cwd: dir, patchPath })

    expect(result).toEqual({
      changes: [{ isSymlink: false, path: '.audit-deps/tooling/cli.mjs', status: 'M' }],
      summaryLines: [],
    })
    expect(findDisallowedPatchChanges(result)).toEqual([
      '.audit-deps/tooling/cli.mjs: path not allowed',
    ])
  })

  it('accepts an in-place manifest change', async () => {
    const { dir, patchPath } = makePatch({
      edit: ({ dir }) => writeFileSync(join(dir, 'packages/ui/package.json'), '{"a":2}\n'),
      files: { 'packages/ui/package.json': '{"a":1}\n' },
    })

    const result = await listPatchChanges({ cwd: dir, patchPath })

    expect(result.changes).toEqual([
      { isSymlink: false, path: 'packages/ui/package.json', status: 'M' },
    ])
    expect(findDisallowedPatchChanges(result)).toEqual([])
  })

  it('rejects a symlink creation', async () => {
    const { dir, patchPath } = makePatch({
      edit: ({ dir }) =>
        symlinkSync('../../.github/evil.yml', join(dir, 'packages/new/package.json')),
      files: { 'packages/new/.keep': '' },
    })

    const result = await listPatchChanges({ cwd: dir, patchPath })

    expect(findDisallowedPatchChanges(result)).toEqual([
      'create mode 120000 packages/new/package.json: not allowed in a patch',
    ])
  })

  it('rejects renames, deletes, and mode changes', async () => {
    const { dir, patchPath } = makePatch({
      edit: ({ dir }) => {
        git(dir, 'mv', 'old.ts', 'package.json')
        git(dir, 'rm', '-q', 'gone/package.json')
        chmodSync(join(dir, 'pnpm-lock.yaml'), 0o755)
      },
      files: {
        'gone/package.json': '{}\n',
        'old.ts': 'some content that is long enough to match\n'.repeat(5),
        'pnpm-lock.yaml': 'lockfileVersion: 9\n',
      },
    })

    const result = await listPatchChanges({ cwd: dir, patchPath })

    expect(result.summaryLines).toEqual([
      'delete mode 100644 gone/package.json',
      'rename old.ts => package.json (100%)',
      'mode change 100644 => 100755 pnpm-lock.yaml',
    ])
    expect(findDisallowedPatchChanges(result)).toHaveLength(3)
  })
})
