import * as migration_20251105_171052_initial from './20251105_171052_initial'

export const migrations = [
  {
    up: migration_20251105_171052_initial.up,
    down: migration_20251105_171052_initial.down,
    name: '20251105_171052_initial',
  },
]
