import * as migration_20241116_000907_initial from './20241116_000907_initial'

export const migrations = [
  {
    up: migration_20241116_000907_initial.up,
    down: migration_20241116_000907_initial.down,
    name: '20241116_000907_initial',
  },
]
