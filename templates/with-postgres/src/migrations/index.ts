import * as migration_20250609_185613_initial from './20250609_185613_initial'

export const migrations = [
  {
    up: migration_20250609_185613_initial.up,
    down: migration_20250609_185613_initial.down,
    name: '20250609_185613_initial',
  },
]
