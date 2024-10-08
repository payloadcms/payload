import type { PostgresAdapter } from '../types'

type RequireDrizzleKit = () => {
  generateDrizzleJson: (args: { schema: Record<string, unknown> }) => unknown
  pushSchema: (
    schema: Record<string, unknown>,
    drizzle: PostgresAdapter['drizzle'],
    filterSchema?: string[],
  ) => Promise<{ apply; hasDataLoss; warnings }>
}

export const requireDrizzleKit: RequireDrizzleKit = () => require('drizzle-kit/api')
