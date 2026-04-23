import * as migration_20260423_135446_initial from './20260423_135446_initial'

export const migrations = [
  {
    up: migration_20260423_135446_initial.up,
    down: migration_20260423_135446_initial.down,
    name: '20260423_135446_initial',
  },
]
