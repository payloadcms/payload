import * as migration_20260810_173215 from './20260810_173215'

export const migrations = [
  {
    up: migration_20260810_173215.up,
    down: migration_20260810_173215.down,
    name: '20260810_173215',
  },
]
