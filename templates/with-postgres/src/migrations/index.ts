import * as migration_20260113_212816_initial from './20260113_212816_initial'

export const migrations = [
  {
    up: migration_20260113_212816_initial.up,
    down: migration_20260113_212816_initial.down,
    name: '20260113_212816_initial',
  },
]
