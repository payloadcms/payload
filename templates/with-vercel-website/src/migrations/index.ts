import * as migration_20251107_183848_initial from './20251107_183848_initial'

export const migrations = [
  {
    up: migration_20251107_183848_initial.up,
    down: migration_20251107_183848_initial.down,
    name: '20251107_183848_initial',
  },
]
