import * as migration_20241213_201248_initial from './20241213_201248_initial'

export const migrations = [
  {
    up: migration_20241213_201248_initial.up,
    down: migration_20241213_201248_initial.down,
    name: '20241213_201248_initial',
  },
]
