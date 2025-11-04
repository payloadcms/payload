import * as migration_20251030_181558_initial from './20251030_181558_initial'

export const migrations = [
  {
    up: migration_20251030_181558_initial.up,
    down: migration_20251030_181558_initial.down,
    name: '20251030_181558_initial',
  },
]
