import * as migration_20250304_151043_initial from './20250304_151043_initial'

export const migrations = [
  {
    up: migration_20250304_151043_initial.up,
    down: migration_20250304_151043_initial.down,
    name: '20250304_151043_initial',
  },
]
