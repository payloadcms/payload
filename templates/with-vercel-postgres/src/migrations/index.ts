import * as migration_20251023_155239_initial from './20251023_155239_initial'

export const migrations = [
  {
    up: migration_20251023_155239_initial.up,
    down: migration_20251023_155239_initial.down,
    name: '20251023_155239_initial',
  },
]
