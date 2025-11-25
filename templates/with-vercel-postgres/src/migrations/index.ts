import * as migration_20251125_185418_initial from './20251125_185418_initial'

export const migrations = [
  {
    up: migration_20251125_185418_initial.up,
    down: migration_20251125_185418_initial.down,
    name: '20251125_185418_initial',
  },
]
