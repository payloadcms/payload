import * as migration_20250616_201653_initial from './20250616_201653_initial'

export const migrations = [
  {
    up: migration_20250616_201653_initial.up,
    down: migration_20250616_201653_initial.down,
    name: '20250616_201653_initial',
  },
]
