import * as migration_20241213_201237_initial from './20241213_201237_initial'

export const migrations = [
  {
    up: migration_20241213_201237_initial.up,
    down: migration_20241213_201237_initial.down,
    name: '20241213_201237_initial',
  },
]
