import * as migration_20260408_163823_initial from './20260408_163823_initial'

export const migrations = [
  {
    up: migration_20260408_163823_initial.up,
    down: migration_20260408_163823_initial.down,
    name: '20260408_163823_initial',
  },
]
