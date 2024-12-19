import * as migration_20241219_223752_initial from './20241219_223752_initial'

export const migrations = [
  {
    up: migration_20241219_223752_initial.up,
    down: migration_20241219_223752_initial.down,
    name: '20241219_223752_initial',
  },
]
