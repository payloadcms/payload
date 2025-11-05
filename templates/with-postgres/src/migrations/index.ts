import * as migration_20251105_171059_initial from './20251105_171059_initial'

export const migrations = [
  {
    up: migration_20251105_171059_initial.up,
    down: migration_20251105_171059_initial.down,
    name: '20251105_171059_initial',
  },
]
