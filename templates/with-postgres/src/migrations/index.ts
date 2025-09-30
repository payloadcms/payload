import * as migration_20250930_133725_initial from './20250930_133725_initial'

export const migrations = [
  {
    up: migration_20250930_133725_initial.up,
    down: migration_20250930_133725_initial.down,
    name: '20250930_133725_initial',
  },
]
