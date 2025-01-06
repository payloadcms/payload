import * as migration_20250106_144508_initial from './20250106_144508_initial'

export const migrations = [
  {
    up: migration_20250106_144508_initial.up,
    down: migration_20250106_144508_initial.down,
    name: '20250106_144508_initial',
  },
]
