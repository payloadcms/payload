import * as migration_20250813_133039_initial from './20250813_133039_initial'

export const migrations = [
  {
    up: migration_20250813_133039_initial.up,
    down: migration_20250813_133039_initial.down,
    name: '20250813_133039_initial',
  },
]
