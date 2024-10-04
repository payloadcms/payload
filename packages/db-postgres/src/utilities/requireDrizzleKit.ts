import type { GenericEnum, GenericRelation, GenericTable, PostgresAdapter } from '../types'

type RequireDrizzleKit = () => {
  generateDrizzleJson: (args: {
    schema: Record<string, GenericEnum | GenericRelation | GenericTable>
  }) => unknown
  pushSchema: (
    schema: Record<string, GenericEnum | GenericRelation | GenericTable>,
    drizzle: PostgresAdapter['drizzle'],
    filterSchema?: string[],
  ) => Promise<{ apply; hasDataLoss; warnings }>
}

export const requireDrizzleKit: RequireDrizzleKit = () => require('drizzle-kit/api')
