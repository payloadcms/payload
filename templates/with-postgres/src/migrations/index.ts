import * as migration_20250219_184633_initial from './20250219_184633_initial'

export const migrations = [
  {
    up: migration_20250219_184633_initial.up,
    down: migration_20250219_184633_initial.down,
    name: '20250219_184633_initial',
  },
]
