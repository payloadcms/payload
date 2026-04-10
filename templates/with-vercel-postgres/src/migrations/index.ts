import * as migration_20260409_155706_initial from './20260409_155706_initial'

export const migrations = [
  {
    up: migration_20260409_155706_initial.up,
    down: migration_20260409_155706_initial.down,
    name: '20260409_155706_initial',
  },
]
