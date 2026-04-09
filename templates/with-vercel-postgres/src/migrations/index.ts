import * as migration_20260408_163814_initial from './20260408_163814_initial'

export const migrations = [
  {
    up: migration_20260408_163814_initial.up,
    down: migration_20260408_163814_initial.down,
    name: '20260408_163814_initial',
  },
]
