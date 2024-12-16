import * as migration_20241216_183217_initial from './20241216_183217_initial'

export const migrations = [
  {
    up: migration_20241216_183217_initial.up,
    down: migration_20241216_183217_initial.down,
    name: '20241216_183217_initial',
  },
]
