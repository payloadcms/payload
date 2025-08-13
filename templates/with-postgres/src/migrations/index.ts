import * as migration_20250813_133122_initial from './20250813_133122_initial'

export const migrations = [
  {
    up: migration_20250813_133122_initial.up,
    down: migration_20250813_133122_initial.down,
    name: '20250813_133122_initial',
  },
]
