import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransforms } from '../../runner.js'
import { serializePackageJson } from '../../utils/packageJson.js'
import { runTransformOnPackageJson } from '../../utils/test-helpers.js'
import { addGraphQLDependencies } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

const GRAPHQL_ROUTE = '/project/src/app/(payload)/api/graphql/route.ts'
const PLAYGROUND_ROUTE = '/project/src/app/(payload)/api/graphql-playground/route.ts'
const CONFIG = '/project/src/payload.config.ts'

const enabledConfig = `import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
})
`

const disabledConfig = `import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  graphQL: {
    disable: true,
  },
})
`

async function runOnProject({
  files,
  packageJson,
}: {
  files: Record<string, string>
  packageJson: string
}) {
  const project = new Project({ useInMemoryFileSystem: true })
  for (const [path, source] of Object.entries(files)) {
    project.createSourceFile(path, source)
  }
  const data = JSON.parse(packageJson) as Record<string, unknown>

  const { results } = await runTransforms({
    packageJsons: [{ data, path: '/project/package.json' }],
    project,
    transforms: [addGraphQLDependencies],
  })

  return {
    packageJson: serializePackageJson(data, packageJson),
    project,
    result: results[0]!,
  }
}

describe('add-graphql-dependencies', () => {
  it('adds the GraphQL packages to a project that depends on @payloadcms/next', async () => {
    const input = await fixture('basic.input.json')
    const output = await fixture('basic.output.json')

    const result = await runTransformOnPackageJson({
      source: input,
      transform: addGraphQLDependencies,
    })

    expect(result).toBe(output)
  })

  it('adds only the missing packages and appends them when dependencies are unsorted', async () => {
    const input = await fixture('partial.input.json')
    const output = await fixture('partial.output.json')

    const result = await runTransformOnPackageJson({
      source: input,
      transform: addGraphQLDependencies,
    })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.json')

    const result = await runTransformOnPackageJson({
      source: output,
      transform: addGraphQLDependencies,
    })

    expect(result).toBe(output)
  })

  it('no-ops on package.json files without @payloadcms/next', async () => {
    const input = await fixture('no-match.input.json')
    const output = await fixture('no-match.output.json')

    const result = await runTransformOnPackageJson({
      source: input,
      transform: addGraphQLDependencies,
    })

    expect(result).toBe(output)
  })

  it('adds the packages and keeps the routes when GraphQL is not disabled', async () => {
    const input = await fixture('basic.input.json')
    const output = await fixture('basic.output.json')

    const { packageJson, project } = await runOnProject({
      files: { [CONFIG]: enabledConfig, [GRAPHQL_ROUTE]: await fixture('graphql-route.input.ts') },
      packageJson: input,
    })

    expect(packageJson).toBe(output)
    expect(project.getSourceFile(GRAPHQL_ROUTE)).toBeDefined()
  })

  it('deletes scaffolded GraphQL routes instead of adding packages when GraphQL is disabled', async () => {
    const input = await fixture('basic.input.json')

    const { packageJson, project, result } = await runOnProject({
      files: {
        [CONFIG]: disabledConfig,
        [GRAPHQL_ROUTE]: await fixture('graphql-route.input.ts'),
        [PLAYGROUND_ROUTE]: await fixture('graphql-playground-route.input.ts'),
      },
      packageJson: input,
    })

    expect(packageJson).toBe(input)
    expect(project.getSourceFile(GRAPHQL_ROUTE)).toBeUndefined()
    expect(project.getSourceFile(PLAYGROUND_ROUTE)).toBeUndefined()
    expect(result.filesChanged).toEqual([GRAPHQL_ROUTE, PLAYGROUND_ROUTE])
  })

  it('keeps a customized GraphQL route when GraphQL is disabled and notes it', async () => {
    const customRoute = `import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

import { withLogging } from '../../../../withLogging'

export const POST = withLogging(GRAPHQL_POST(config))

export const OPTIONS = REST_OPTIONS(config)
`

    const { project, result } = await runOnProject({
      files: { [CONFIG]: disabledConfig, [GRAPHQL_ROUTE]: customRoute },
      packageJson: await fixture('basic.input.json'),
    })

    expect(project.getSourceFile(GRAPHQL_ROUTE)?.getFullText()).toBe(customRoute)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining(GRAPHQL_ROUTE)])
  })

  it('adds the packages when the disable flag is not a literal true', async () => {
    const config = `import { buildConfig } from 'payload'

export default buildConfig({
  graphQL: {
    disable: process.env.DISABLE_GRAPHQL === 'true',
  },
})
`

    const { packageJson, project } = await runOnProject({
      files: { [CONFIG]: config, [GRAPHQL_ROUTE]: await fixture('graphql-route.input.ts') },
      packageJson: await fixture('basic.input.json'),
    })

    expect(packageJson).toBe(await fixture('basic.output.json'))
    expect(project.getSourceFile(GRAPHQL_ROUTE)).toBeDefined()
  })

  it('is idempotent when GraphQL is disabled', async () => {
    const input = await fixture('basic.input.json')

    const { project } = await runOnProject({
      files: { [CONFIG]: disabledConfig, [GRAPHQL_ROUTE]: await fixture('graphql-route.input.ts') },
      packageJson: input,
    })
    const { results } = await runTransforms({ project, transforms: [addGraphQLDependencies] })

    expect(results[0]?.filesChanged).toEqual([])
  })
})
