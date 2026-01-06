import * as migration_20260106_024703_initial from './20260106_024703_initial'

export const migrations = [
  {
    up: migration_20260106_024703_initial.up,
    down: migration_20260106_024703_initial.down,
    name: '20260106_024703_initial',
  },
]
