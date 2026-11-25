import type * as DrizzleKit from 'drizzle-kit/payload/postgres'

import nodeModule from 'node:module'
import { dynamicImport } from 'payload'

import type { DrizzleSnapshotJSON, RequireDrizzleKit } from '../types.js'

type Kit = Awaited<ReturnType<RequireDrizzleKit>>

export const createRequireDrizzleKit =
  ({
    from,
  }: {
    /** Module URL of the adapter that owns the drizzle-kit dependency. */
    from: string
  }): RequireDrizzleKit =>
  async () => {
    // Use the default import to preserve Node's loader instead of Webpack's createRequire transform.
    const require = nodeModule.createRequire(from)
    const { generateDrizzleJson, generateMigration, pushSchema, reconstruct, up } =
      await dynamicImport<typeof DrizzleKit>(require.resolve('drizzle-kit/payload/postgres'))

    return {
      generateDrizzleJson,
      generateMigration: (before, after, options) =>
        generateMigration(before, after, {
          ...(options as Parameters<typeof generateMigration>[2]),
          // Payload can connect to a pre-created schema, including after dropDatabase recreates it.
          createSchemaIfNotExists: true,
        }) as ReturnType<Kit['generateMigration']>,
      // The adapter's drizzle instance is typed as a union of every dialect.
      pushSchema: pushSchema as unknown as Kit['pushSchema'],
      reconstruct: (snapshots, id) => reconstruct(snapshots, id) as Promise<DrizzleSnapshotJSON>,
      upSnapshots: (snapshots) => up(snapshots) as ReturnType<Kit['upSnapshots']>,
    }
  }

export const requireDrizzleKit = createRequireDrizzleKit({ from: import.meta.url })
