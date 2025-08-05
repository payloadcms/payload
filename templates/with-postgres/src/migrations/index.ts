import * as migration_20250805_134410_initial from './20250805_134410_initial'

export const migrations = [
  {
    up: migration_20250805_134410_initial.up,
    down: migration_20250805_134410_initial.down,
    name: '20250805_134410_initial',
  },
]
