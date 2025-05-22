import * as migration_20250522_154901_initial from './20250522_154901_initial'

export const migrations = [
  {
    up: migration_20250522_154901_initial.up,
    down: migration_20250522_154901_initial.down,
    name: '20250522_154901_initial',
  },
]
