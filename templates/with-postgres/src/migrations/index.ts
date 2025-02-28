import * as migration_20250227_171503_initial from './20250227_171503_initial'

export const migrations = [
  {
    up: migration_20250227_171503_initial.up,
    down: migration_20250227_171503_initial.down,
    name: '20250227_171503_initial',
  },
]
