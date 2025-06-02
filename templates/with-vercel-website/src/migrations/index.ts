import * as migration_20250529_195131_initial from './20250529_195131_initial'

export const migrations = [
  {
    up: migration_20250529_195131_initial.up,
    down: migration_20250529_195131_initial.down,
    name: '20250529_195131_initial',
  },
]
