import * as migration_20251105_063738_initial from './20251105_063738_initial'

export const migrations = [
  {
    up: migration_20251105_063738_initial.up,
    down: migration_20251105_063738_initial.down,
    name: '20251105_063738_initial',
  },
]
