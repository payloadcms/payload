import * as migration_20250529_195145_initial from './20250529_195145_initial'

export const migrations = [
  {
    up: migration_20250529_195145_initial.up,
    down: migration_20250529_195145_initial.down,
    name: '20250529_195145_initial',
  },
]
