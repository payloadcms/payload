import type { RequireDrizzleKit } from '../types.js'

type DrizzleKit = ReturnType<RequireDrizzleKit>

export const createRequireDrizzleKit = ({
  load,
}: {
  load: () => Promise<DrizzleKit>
}): RequireDrizzleKit => {
  let drizzleKitPromise: Promise<DrizzleKit> | undefined

  const loadDrizzleKit = () => {
    const promise = load().catch((error: unknown) => {
      drizzleKitPromise = undefined
      throw error
    })
    drizzleKitPromise = promise
    return promise
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
