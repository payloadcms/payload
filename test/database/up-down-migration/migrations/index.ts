import * as migration_20260810_194920 from './20260810_194920'

export const migrations = [
  {
    up: migration_20260810_194920.up,
    down: migration_20260810_194920.down,
    name: '20260810_194920',
  },
]
