import * as migration_20250815_145322_initial from './20250815_145322_initial'

export const migrations = [
  {
    up: migration_20250815_145322_initial.up,
    down: migration_20250815_145322_initial.down,
    name: '20250815_145322_initial',
  },
]
