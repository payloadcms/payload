import * as migration_20251219_215102_initial from './20251219_215102_initial'

export const migrations = [
  {
    up: migration_20251219_215102_initial.up,
    down: migration_20251219_215102_initial.down,
    name: '20251219_215102_initial',
  },
]
