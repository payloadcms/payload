import type { DatabaseAdapterObj } from 'payload'

/**
 * Type-only stub used so eval fixtures satisfy `buildConfig`'s required `db`
 * field without pulling in a real adapter. Fixtures are type-checked, never
 * executed, so an empty object cast to the adapter type is sufficient.
 */
export const stubAdapter = {} as DatabaseAdapterObj
