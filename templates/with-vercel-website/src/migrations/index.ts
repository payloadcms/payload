import * as migration_20251107_152407_initial from './20251107_152407_initial'

export const migrations = [
  {
    up: migration_20251107_152407_initial.up,
    down: migration_20251107_152407_initial.down,
    name: '20251107_152407_initial',
  },
]
