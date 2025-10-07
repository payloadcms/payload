import * as migration_20251007_201834_initial from './20251007_201834_initial'

export const migrations = [
  {
    up: migration_20251007_201834_initial.up,
    down: migration_20251007_201834_initial.down,
    name: '20251007_201834_initial',
  },
]
