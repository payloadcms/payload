import * as migration_20241210_000627_initial from './20241210_000627_initial'

export const migrations = [
  {
    up: migration_20241210_000627_initial.up,
    down: migration_20241210_000627_initial.down,
    name: '20241210_000627_initial',
  },
]
