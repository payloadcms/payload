import * as migration_20260408_163830_initial from './20260408_163830_initial'

export const migrations = [
  {
    up: migration_20260408_163830_initial.up,
    down: migration_20260408_163830_initial.down,
    name: '20260408_163830_initial',
  },
]
