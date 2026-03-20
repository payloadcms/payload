import * as migration_20260319_165026_initial from './20260319_165026_initial'

export const migrations = [
  {
    up: migration_20260319_165026_initial.up,
    down: migration_20260319_165026_initial.down,
    name: '20260319_165026_initial',
  },
]
