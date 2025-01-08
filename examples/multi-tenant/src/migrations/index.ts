import * as migration_seed from './seed'

export const migrations = [
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed',
  },
]
