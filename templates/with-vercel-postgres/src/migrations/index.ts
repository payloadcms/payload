import * as migration_20250815_145302_initial from './20250815_145302_initial'

export const migrations = [
  {
    up: migration_20250815_145302_initial.up,
    down: migration_20250815_145302_initial.down,
    name: '20250815_145302_initial',
  },
]
