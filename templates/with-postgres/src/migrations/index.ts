import * as migration_20251107_152426_initial from './20251107_152426_initial'

export const migrations = [
  {
    up: migration_20251107_152426_initial.up,
    down: migration_20251107_152426_initial.down,
    name: '20251107_152426_initial',
  },
]
