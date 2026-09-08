import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const workspaceDirectory = fileURLToPath(new URL('../../../../', import.meta.url))

describe('SQLite adapter runtime bundles', () => {
  it.each(['db-sqlite', 'db-d1-sqlite'])(
    'should bundle %s without a Drizzle Kit dependency',
    async (adapter) => {
      const result = await bundleAdapter({ adapter })
      const inputs = Object.keys(result.metafile.inputs)
      const imports = Object.values(result.metafile.outputs).flatMap((output) => output.imports)

      expect(inputs.some((input) => input.endsWith('sqlite/createRequireDrizzleKit.ts'))).toBe(true)
      expect(imports.filter((entry) => entry.path.startsWith('drizzle-kit'))).toEqual([])
      expect(result.outputFiles[0].text).not.toMatch(/require\d*\(["']drizzle-kit\/api["']\)/)
    },
  )

  // Positive control: the same bundler must detect the old literal require pattern.
  it('should detect Drizzle Kit in the PostgreSQL adapter bundle', async () => {
    const result = await bundleAdapter({ adapter: 'db-postgres' })
    // esbuild preserves createRequire calls rather than listing them in its import metadata.
    expect(result.outputFiles[0].text).toMatch(/require\d*\(["']drizzle-kit\/api["']\)/)
  })
})

function bundleAdapter({ adapter }: { adapter: string }) {
  return build({
    absWorkingDir: workspaceDirectory,
    bundle: true,
    entryPoints: [`packages/${adapter}/src/index.ts`],
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    platform: 'node',
    plugins: [
      {
        name: 'adapter-dependencies',
        setup(builder) {
          // Bundle the shared adapter code; leave its third-party dependencies external.
          builder.onResolve({ filter: /^[^./]/ }, ({ path: specifier }) => {
            if (
              specifier === '@payloadcms/drizzle' ||
              specifier.startsWith('@payloadcms/drizzle/')
            ) {
              return undefined
            }

            return { external: true, path: specifier }
          })
        },
      },
    ],
    tsconfig: path.join(workspaceDirectory, 'packages', adapter, 'tsconfig.json'),
    write: false,
  })
}
