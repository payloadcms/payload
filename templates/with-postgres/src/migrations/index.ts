import * as migration_20251210_193916_initial from './20251210_193916_initial'

export const migrations = [
  {
    up: migration_20251210_193916_initial.up,
    down: migration_20251210_193916_initial.down,
    name: '20251210_193916_initial',
  },
]
