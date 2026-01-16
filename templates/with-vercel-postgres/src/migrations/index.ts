import * as migration_20260116_205520_initial from './20260116_205520_initial'

export const migrations = [
  {
    up: migration_20260116_205520_initial.up,
    down: migration_20260116_205520_initial.down,
    name: '20260116_205520_initial',
  },
]
