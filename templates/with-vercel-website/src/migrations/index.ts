import * as migration_20260130_163922_initial from './20260130_163922_initial'

export const migrations = [
  {
    up: migration_20260130_163922_initial.up,
    down: migration_20260130_163922_initial.down,
    name: '20260130_163922_initial',
  },
]
