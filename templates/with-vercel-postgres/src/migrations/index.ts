import * as migration_20250522_150833_initial from './20250522_150833_initial'

export const migrations = [
  {
    up: migration_20250522_150833_initial.up,
    down: migration_20250522_150833_initial.down,
    name: '20250522_150833_initial',
  },
]
