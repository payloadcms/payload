import * as migration_20251007_201813_initial from './20251007_201813_initial'

export const migrations = [
  {
    up: migration_20251007_201813_initial.up,
    down: migration_20251007_201813_initial.down,
    name: '20251007_201813_initial',
  },
]
