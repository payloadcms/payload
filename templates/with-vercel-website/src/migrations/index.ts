import * as migration_20251214_201212_initial from './20251214_201212_initial'

export const migrations = [
  {
    up: migration_20251214_201212_initial.up,
    down: migration_20251214_201212_initial.down,
    name: '20251214_201212_initial',
  },
]
