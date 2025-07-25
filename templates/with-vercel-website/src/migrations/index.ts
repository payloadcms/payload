import * as migration_20250725_134247_initial from './20250725_134247_initial'

export const migrations = [
  {
    up: migration_20250725_134247_initial.up,
    down: migration_20250725_134247_initial.down,
    name: '20250725_134247_initial',
  },
]
