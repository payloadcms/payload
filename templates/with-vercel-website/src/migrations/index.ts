import * as migration_20241220_195012_initial from './20241220_195012_initial'

export const migrations = [
  {
    up: migration_20241220_195012_initial.up,
    down: migration_20241220_195012_initial.down,
    name: '20241220_195012_initial',
  },
]
