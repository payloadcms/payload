import * as migration_20250522_150837_initial from './20250522_150837_initial'

export const migrations = [
  {
    up: migration_20250522_150837_initial.up,
    down: migration_20250522_150837_initial.down,
    name: '20250522_150837_initial',
  },
]
