import * as migration_20251209_194015_initial from './20251209_194015_initial'

export const migrations = [
  {
    up: migration_20251209_194015_initial.up,
    down: migration_20251209_194015_initial.down,
    name: '20251209_194015_initial',
  },
]
