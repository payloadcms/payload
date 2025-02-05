import * as migration_20250205_192427_initial from './20250205_192427_initial'

export const migrations = [
  {
    up: migration_20250205_192427_initial.up,
    down: migration_20250205_192427_initial.down,
    name: '20250205_192427_initial',
  },
]
