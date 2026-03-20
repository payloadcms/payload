import * as migration_20260319_165009_initial from './20260319_165009_initial'

export const migrations = [
  {
    up: migration_20260319_165009_initial.up,
    down: migration_20260319_165009_initial.down,
    name: '20260319_165009_initial',
  },
]
