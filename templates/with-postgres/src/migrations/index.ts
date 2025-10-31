import * as migration_20251030_181618_initial from './20251030_181618_initial'

export const migrations = [
  {
    up: migration_20251030_181618_initial.up,
    down: migration_20251030_181618_initial.down,
    name: '20251030_181618_initial',
  },
]
