import * as migration_20241116_000912_initial from './20241116_000912_initial'

export const migrations = [
  {
    up: migration_20241116_000912_initial.up,
    down: migration_20241116_000912_initial.down,
    name: '20241116_000912_initial',
  },
]
