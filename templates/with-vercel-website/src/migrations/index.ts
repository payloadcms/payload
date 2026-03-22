import * as migration_20260319_165018_initial from './20260319_165018_initial'

export const migrations = [
  {
    up: migration_20260319_165018_initial.up,
    down: migration_20260319_165018_initial.down,
    name: '20260319_165018_initial',
  },
]
