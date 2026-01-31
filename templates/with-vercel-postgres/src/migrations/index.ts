import * as migration_20260130_163858_initial from './20260130_163858_initial'

export const migrations = [
  {
    up: migration_20260130_163858_initial.up,
    down: migration_20260130_163858_initial.down,
    name: '20260130_163858_initial',
  },
]
