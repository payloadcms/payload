import * as migration_20251107_183841_initial from './20251107_183841_initial'

export const migrations = [
  {
    up: migration_20251107_183841_initial.up,
    down: migration_20251107_183841_initial.down,
    name: '20251107_183841_initial',
  },
]
