import * as migration_20260130_163944_initial from './20260130_163944_initial'

export const migrations = [
  {
    up: migration_20260130_163944_initial.up,
    down: migration_20260130_163944_initial.down,
    name: '20260130_163944_initial',
  },
]
