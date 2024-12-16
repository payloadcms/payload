import * as migration_20241216_183230_initial from './20241216_183230_initial'

export const migrations = [
  {
    up: migration_20241216_183230_initial.up,
    down: migration_20241216_183230_initial.down,
    name: '20241216_183230_initial',
  },
]
