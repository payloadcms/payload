import * as migration_20250219_184608_initial from './20250219_184608_initial'

export const migrations = [
  {
    up: migration_20250219_184608_initial.up,
    down: migration_20250219_184608_initial.down,
    name: '20250219_184608_initial',
  },
]
