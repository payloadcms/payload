import { dynamicImport } from 'payload'

import type { RequireDrizzleKit } from '../types.js'

type DrizzleKit = ReturnType<RequireDrizzleKit>

export const createRequireDrizzleKit = ({
  from,
  packageName,
}: {
  /** Module URL of the adapter that owns the drizzle-kit dependency. */
  from: string
  /** Named in the error thrown when the load fails, so the message points at the adapter. */
  packageName: string
}): RequireDrizzleKit => {
  let drizzleKitPromise: Promise<DrizzleKit> | undefined

  const loadDrizzleKit = () => {
    // Hide schema tooling from Next.js / OpenNext static dependency analysis.
    return dynamicImport<{
      generateSQLiteDrizzleJson: DrizzleKit['generateDrizzleJson']
      generateSQLiteMigration: DrizzleKit['generateMigration']
      pushSQLiteSchema: DrizzleKit['pushSchema']
    }>('drizzle-kit/api', { from })
      .then(({ generateSQLiteDrizzleJson, generateSQLiteMigration, pushSQLiteSchema }) => ({
        generateDrizzleJson: generateSQLiteDrizzleJson,
        generateMigration: generateSQLiteMigration,
        pushSchema: pushSQLiteSchema,
      }))
      .catch((error: unknown) => {
        drizzleKitPromise = undefined

        throw new Error(
          `Could not load drizzle-kit, which ${packageName} needs to generate migrations and to push schema changes. Drizzle Kit is not needed to serve requests, so it is often left out of a production bundle. Generate migrations before you deploy, or make drizzle-kit available in this environment.`,
          { cause: error },
        )
      })
  }

  const getDrizzleKit = () => {
    drizzleKitPromise ??= loadDrizzleKit()
    return drizzleKitPromise
  }

  return () => ({
    generateDrizzleJson: async (...args) => {
      const { generateDrizzleJson } = await getDrizzleKit()
      return generateDrizzleJson(...args)
    },
    generateMigration: async (...args) => {
      const { generateMigration } = await getDrizzleKit()
      return generateMigration(...args)
    },
    pushSchema: async (...args) => {
      const { pushSchema } = await getDrizzleKit()
      return pushSchema(...args)
    },
  })
}
