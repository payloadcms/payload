import * as migration_20250609_185543_initial from './20250609_185543_initial'

export const migrations = [
  {
    up: migration_20250609_185543_initial.up,
    down: migration_20250609_185543_initial.down,
    name: '20250609_185543_initial',
  },
]
