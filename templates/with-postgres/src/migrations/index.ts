import * as migration_20251214_201230_initial from './20251214_201230_initial'

export const migrations = [
  {
    up: migration_20251214_201230_initial.up,
    down: migration_20251214_201230_initial.down,
    name: '20251214_201230_initial',
  },
]
