import * as migration_20260810_165251 from './20260810_165251'

export const migrations = [
  {
    up: migration_20260810_165251.up,
    down: migration_20260810_165251.down,
    name: '20260810_165251',
  },
]
