import * as migration_20250616_201710_initial from './20250616_201710_initial'

export const migrations = [
  {
    up: migration_20250616_201710_initial.up,
    down: migration_20250616_201710_initial.down,
    name: '20250616_201710_initial',
  },
]
