import * as migration_20250106_144513_initial from './20250106_144513_initial'

export const migrations = [
  {
    up: migration_20250106_144513_initial.up,
    down: migration_20250106_144513_initial.down,
    name: '20250106_144513_initial',
  },
]
