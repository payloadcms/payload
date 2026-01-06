import * as migration_20260106_024646_initial from './20260106_024646_initial'

export const migrations = [
  {
    up: migration_20260106_024646_initial.up,
    down: migration_20260106_024646_initial.down,
    name: '20260106_024646_initial',
  },
]
