import * as migration_20241116_000910_initial from './20241116_000910_initial'

export const migrations = [
  {
    up: migration_20241116_000910_initial.up,
    down: migration_20241116_000910_initial.down,
    name: '20241116_000910_initial',
  },
]
