import * as migration_20241228_171151_initial from './20241228_171151_initial'

export const migrations = [
  {
    up: migration_20241228_171151_initial.up,
    down: migration_20241228_171151_initial.down,
    name: '20241228_171151_initial',
  },
]
