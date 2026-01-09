import * as migration_20260106_030119_initial from './20260106_030119_initial'

export const migrations = [
  {
    up: migration_20260106_030119_initial.up,
    down: migration_20260106_030119_initial.down,
    name: '20260106_030119_initial',
  },
]
