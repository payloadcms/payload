import * as migration_20251125_185437_initial from './20251125_185437_initial'

export const migrations = [
  {
    up: migration_20251125_185437_initial.up,
    down: migration_20251125_185437_initial.down,
    name: '20251125_185437_initial',
  },
]
