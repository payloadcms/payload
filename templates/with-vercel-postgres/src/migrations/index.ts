import * as migration_20241213_201223_initial from './20241213_201223_initial'

export const migrations = [
  {
    up: migration_20241213_201223_initial.up,
    down: migration_20241213_201223_initial.down,
    name: '20241213_201223_initial',
  },
]
