import * as migration_20251105_171044_initial from './20251105_171044_initial'

export const migrations = [
  {
    up: migration_20251105_171044_initial.up,
    down: migration_20251105_171044_initial.down,
    name: '20251105_171044_initial',
  },
]
