import * as migration_20260116_205541_initial from './20260116_205541_initial'

export const migrations = [
  {
    up: migration_20260116_205541_initial.up,
    down: migration_20260116_205541_initial.down,
    name: '20260116_205541_initial',
  },
]
