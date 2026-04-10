import * as migration_20260409_155734_initial from './20260409_155734_initial'

export const migrations = [
  {
    up: migration_20260409_155734_initial.up,
    down: migration_20260409_155734_initial.down,
    name: '20260409_155734_initial',
  },
]
