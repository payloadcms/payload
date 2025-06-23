import * as migration_20250616_190121 from './20250616_190121.js'

export const migrations = [
  {
    up: migration_20250616_190121.up,
    down: migration_20250616_190121.down,
    name: '20250616_190121',
  },
]
