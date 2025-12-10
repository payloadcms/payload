import * as migration_20251209_213039_initial from './20251209_213039_initial'

export const migrations = [
  {
    up: migration_20251209_213039_initial.up,
    down: migration_20251209_213039_initial.down,
    name: '20251209_213039_initial',
  },
]
