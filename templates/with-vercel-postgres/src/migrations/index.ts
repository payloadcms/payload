import * as migration_20250715_002311_initial from './20250715_002311_initial'

export const migrations = [
  {
    up: migration_20250715_002311_initial.up,
    down: migration_20250715_002311_initial.down,
    name: '20250715_002311_initial',
  },
]
