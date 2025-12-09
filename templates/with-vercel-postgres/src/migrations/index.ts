import * as migration_20251209_193953_initial from './20251209_193953_initial'

export const migrations = [
  {
    up: migration_20251209_193953_initial.up,
    down: migration_20251209_193953_initial.down,
    name: '20251209_193953_initial',
  },
]
