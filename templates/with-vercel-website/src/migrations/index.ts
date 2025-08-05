import * as migration_20250805_134351_initial from './20250805_134351_initial'

export const migrations = [
  {
    up: migration_20250805_134351_initial.up,
    down: migration_20250805_134351_initial.down,
    name: '20250805_134351_initial',
  },
]
