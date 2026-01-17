import * as migration_20260113_214553_initial from './20260113_214553_initial'

export const migrations = [
  {
    up: migration_20260113_214553_initial.up,
    down: migration_20260113_214553_initial.down,
    name: '20260113_214553_initial',
  },
]
