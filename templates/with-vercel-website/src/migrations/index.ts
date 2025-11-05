import * as migration_20251105_063755_initial from './20251105_063755_initial'

export const migrations = [
  {
    up: migration_20251105_063755_initial.up,
    down: migration_20251105_063755_initial.down,
    name: '20251105_063755_initial',
  },
]
