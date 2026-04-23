import * as migration_20260423_135419_initial from './20260423_135419_initial'

export const migrations = [
  {
    up: migration_20260423_135419_initial.up,
    down: migration_20260423_135419_initial.down,
    name: '20260423_135419_initial',
  },
]
