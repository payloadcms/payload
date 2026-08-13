import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { loadProject } from './cli.js'
import { addOverrideAccessTrue } from './transforms/add-override-access-true/index.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('loadProject', () => {
  it('should preserve the tsconfig source scope by default', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'payload-codemod-'))
    temporaryDirectories.push(directory)

    await mkdir(join(directory, 'src'), { recursive: true })
    await mkdir(join(directory, 'test'), { recursive: true })
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { allowJs: false }, include: ['src/**/*.ts'] }),
    )
    await writeFile(join(directory, 'src', 'included.ts'), 'export const included = true\n')
    await writeFile(join(directory, 'test', 'excluded.ts'), 'export const excluded = true\n')

    const project = loadProject({ path: directory })

    expect(project.getSourceFile(join(directory, 'src', 'included.ts'))).toBeDefined()
    expect(project.getSourceFile(join(directory, 'test', 'excluded.ts'))).toBeUndefined()
  })

  it('should load eligible TypeScript and JavaScript files excluded by tsconfig when requested', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'payload-codemod-'))
    temporaryDirectories.push(directory)

    await mkdir(join(directory, 'src'), { recursive: true })
    await mkdir(join(directory, 'test'), { recursive: true })
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { allowJs: false }, include: ['src/**/*.ts'] }),
    )
    await writeFile(join(directory, 'src', 'included.ts'), 'export const included = true\n')
    await writeFile(
      join(directory, 'test', 'excluded.ts'),
      `import { getPayload } from 'payload'

declare const config: unknown
const payload = await getPayload({ config })
await payload.find({ collection: 'posts' })
`,
    )
    await writeFile(
      join(directory, 'test', 'excluded.js'),
      `import { getPayload } from 'payload'

const payload = await getPayload({ config: {} })
await payload.find({ collection: 'posts' })
`,
    )

    const project = loadProject({ path: directory, shouldLoadAllSourceFiles: true })

    await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(
      project.getSourceFileOrThrow(join(directory, 'test', 'excluded.ts')).getFullText(),
    ).toContain("payload.find({ overrideAccess: true, collection: 'posts' })")
    expect(
      project.getSourceFileOrThrow(join(directory, 'test', 'excluded.js')).getFullText(),
    ).toContain("payload.find({ overrideAccess: true, collection: 'posts' })")
  })
})
