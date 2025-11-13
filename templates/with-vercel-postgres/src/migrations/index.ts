import * as migration_20251112_235210_initial from './20251112_235210_initial'

export const migrations = [
  {
    up: migration_20251112_235210_initial.up,
    down: migration_20251112_235210_initial.down,
    name: '20251112_235210_initial',
  },
]
