import * as migration_20250304_151030_initial from './20250304_151030_initial'

export const migrations = [
  {
    up: migration_20250304_151030_initial.up,
    down: migration_20250304_151030_initial.down,
    name: '20250304_151030_initial',
  },
]
