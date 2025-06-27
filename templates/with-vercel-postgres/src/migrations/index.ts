import * as migration_20250624_171210_initial from './20250624_171210_initial'

export const migrations = [
  {
    up: migration_20250624_171210_initial.up,
    down: migration_20250624_171210_initial.down,
    name: '20250624_171210_initial',
  },
]
