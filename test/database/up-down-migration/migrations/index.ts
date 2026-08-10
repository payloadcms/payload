import * as migration_20260810_163511 from './20260810_163511'

export const migrations = [
  {
    up: migration_20260810_163511.up,
    down: migration_20260810_163511.down,
    name: '20260810_163511',
  },
]
