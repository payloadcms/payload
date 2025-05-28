import * as migration_20250522_154847_initial from './20250522_154847_initial'

export const migrations = [
  {
    up: migration_20250522_154847_initial.up,
    down: migration_20250522_154847_initial.down,
    name: '20250522_154847_initial',
  },
]
