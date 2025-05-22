import * as migration_20250522_142545_initial from './20250522_142545_initial'

export const migrations = [
  {
    up: migration_20250522_142545_initial.up,
    down: migration_20250522_142545_initial.down,
    name: '20250522_142545_initial',
  },
]
