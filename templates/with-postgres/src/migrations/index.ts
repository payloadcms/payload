import * as migration_20241216_183241_initial from './20241216_183241_initial'

export const migrations = [
  {
    up: migration_20241216_183241_initial.up,
    down: migration_20241216_183241_initial.down,
    name: '20241216_183241_initial',
  },
]
