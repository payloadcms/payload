import * as migration_20260423_135435_initial from './20260423_135435_initial'

export const migrations = [
  {
    up: migration_20260423_135435_initial.up,
    down: migration_20260423_135435_initial.down,
    name: '20260423_135435_initial',
  },
]
