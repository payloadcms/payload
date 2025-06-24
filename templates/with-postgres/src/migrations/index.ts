import * as migration_20250616_201724_initial from './20250616_201724_initial'

export const migrations = [
  {
    up: migration_20250616_201724_initial.up,
    down: migration_20250616_201724_initial.down,
    name: '20250616_201724_initial',
  },
]
