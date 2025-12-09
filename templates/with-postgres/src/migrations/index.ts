import * as migration_20251209_194034_initial from './20251209_194034_initial'

export const migrations = [
  {
    up: migration_20251209_194034_initial.up,
    down: migration_20251209_194034_initial.down,
    name: '20251209_194034_initial',
  },
]
