import * as migration_20250715_002336_initial from './20250715_002336_initial'

export const migrations = [
  {
    up: migration_20250715_002336_initial.up,
    down: migration_20250715_002336_initial.down,
    name: '20250715_002336_initial',
  },
]
