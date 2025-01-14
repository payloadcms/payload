import * as migration_20250110_191955_initial from './20250110_191955_initial'

export const migrations = [
  {
    up: migration_20250110_191955_initial.up,
    down: migration_20250110_191955_initial.down,
    name: '20250110_191955_initial',
  },
]
