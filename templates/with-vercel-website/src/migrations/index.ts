import * as migration_20260113_212756_initial from './20260113_212756_initial'

export const migrations = [
  {
    up: migration_20260113_212756_initial.up,
    down: migration_20260113_212756_initial.down,
    name: '20260113_212756_initial',
  },
]
