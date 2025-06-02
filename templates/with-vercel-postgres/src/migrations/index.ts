import * as migration_20250529_195116_initial from './20250529_195116_initial'

export const migrations = [
  {
    up: migration_20250529_195116_initial.up,
    down: migration_20250529_195116_initial.down,
    name: '20250529_195116_initial',
  },
]
