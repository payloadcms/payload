import * as migration_20251016_165426_initial from './20251016_165426_initial'

export const migrations = [
  {
    up: migration_20251016_165426_initial.up,
    down: migration_20251016_165426_initial.down,
    name: '20251016_165426_initial',
  },
]
