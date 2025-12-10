import * as migration_20251210_193856_initial from './20251210_193856_initial'

export const migrations = [
  {
    up: migration_20251210_193856_initial.up,
    down: migration_20251210_193856_initial.down,
    name: '20251210_193856_initial',
  },
]
